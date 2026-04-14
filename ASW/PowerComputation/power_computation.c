/**
 * @file    power_computation.c
 * @brief   Power computation — ASW layer
 *
 * Instantaneous power = V_pack × I_pack.
 * Dynamic limits are de-rated based on temperature and SoC:
 *  - Below 20% SoC: discharge limit tapers linearly to 0 at 5%
 *  - Above 40°C:    both limits taper linearly to 0 at 60°C
 * Energy is integrated at each 100ms tick and accumulated in NVM
 * on each scheduler cycle (every 10 seconds — inferred from code).
 */

#include "power_computation.h"
#include "batt_if.h"
#include "nvm.h"

/* ── Private state ────────────────────────────────────────────────── */
static PWRCOMP_Result_t s_result;
static uint32_t         s_tick = 0U;

/* ── Private helpers ──────────────────────────────────────────────── */
static uint32_t prv_derate_by_temp(uint32_t base_w, int16_t temp_x10);
static uint32_t prv_derate_by_soc(uint32_t base_w, uint8_t soc_pct);

/* ── Public ───────────────────────────────────────────────────────── */
void PWRCOMP_Init(void)
{
    /* Restore lifetime energy counters from NVM */
    NVM_ReadU32(0x0050U, &s_result.energy_charged_wh_x1000);
    NVM_ReadU32(0x0051U, &s_result.energy_discharged_wh_x1000);
    s_result.session_energy_wh_x1000 = 0U;
    s_result.data_valid = false;
    s_tick = 0U;
}

void PWRCOMP_Tick(void)
{
    s_tick++;
    const BATT_State_t *batt = BATT_IF_GetState();
    if (!batt->data_valid) { s_result.data_valid = false; return; }

    /* Instantaneous power: P = V × I (mV × mA → mW → W) */
    int64_t p_mw = (int64_t)batt->pack_voltage_mv * batt->pack_current_ma;
    s_result.instantaneous_power_w = (int32_t)(p_mw / 1000000LL);

    /* Energy integration over tick period */
    /* E (Wh × 1000) += P(W) × dt(ms) / 3600 */
    uint32_t dt_ms = PWRCOMP_TICK_PERIOD_MS;
    if (s_result.instantaneous_power_w > 0) {
        uint64_t de = (uint64_t)s_result.instantaneous_power_w * dt_ms
                      * PWRCOMP_ENERGY_SCALE / 3600000U;
        s_result.energy_charged_wh_x1000   += (uint32_t)de;
        s_result.session_energy_wh_x1000   += (uint32_t)de;
    } else {
        uint64_t de = (uint64_t)(-s_result.instantaneous_power_w) * dt_ms
                      * PWRCOMP_ENERGY_SCALE / 3600000U;
        s_result.energy_discharged_wh_x1000 += (uint32_t)de;
        s_result.session_energy_wh_x1000    += (uint32_t)de;
    }

    /* Dynamic limits — start from max and derate */
    uint32_t chg_limit = PWRCOMP_MAX_CHG_PWR_W;
    uint32_t dsc_limit = PWRCOMP_MAX_DSC_PWR_W;

    chg_limit = prv_derate_by_temp(chg_limit, batt->max_temp_degc_x10);
    dsc_limit = prv_derate_by_temp(dsc_limit, batt->max_temp_degc_x10);
    dsc_limit = prv_derate_by_soc(dsc_limit,  batt->soc_percent);

    s_result.max_charge_power_w    = chg_limit;
    s_result.max_discharge_power_w = dsc_limit;

    /* Persist energy to NVM every 100 ticks (10 seconds) */
    if (s_tick % 100U == 0U) {
        NVM_WriteU32(0x0050U, s_result.energy_charged_wh_x1000);
        NVM_WriteU32(0x0051U, s_result.energy_discharged_wh_x1000);
    }

    s_result.data_valid = true;
}

const PWRCOMP_Result_t *PWRCOMP_GetResult(void)         { return &s_result; }
uint32_t PWRCOMP_GetMaxChargePowerW(void)   { return s_result.max_charge_power_w; }
uint32_t PWRCOMP_GetMaxDischargePowerW(void){ return s_result.max_discharge_power_w; }
int32_t  PWRCOMP_GetInstantPowerW(void)     { return s_result.instantaneous_power_w; }

/* ── Private: thermal de-rating ──────────────────────────────────── */
static uint32_t prv_derate_by_temp(uint32_t base_w, int16_t temp_x10)
{
    /* Full power below 40°C, linear taper to 0 at 60°C */
    if (temp_x10 <= 400) { return base_w; }
    if (temp_x10 >= 600) { return 0U; }
    return base_w * (uint32_t)(600 - temp_x10) / 200U;
}

/* ── Private: SoC de-rating ──────────────────────────────────────── */
static uint32_t prv_derate_by_soc(uint32_t base_w, uint8_t soc_pct)
{
    /* Full discharge power above 20%, linear taper to 0 at 5% */
    if (soc_pct >= 20U) { return base_w; }
    if (soc_pct <= 5U)  { return 0U; }
    return base_w * (soc_pct - 5U) / 15U;
}
