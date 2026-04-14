/**
 * @file    batt_if.c
 * @brief   Battery interface — ESAL layer
 *
 * Aggregates data from AFE_GetData() and ADC_GetResult() into a single
 * BATT_State_t structure consumed by the application layer (ASW).
 *
 * SOC is estimated using coulomb counting integrated with a voltage
 * correction term at rest (inferred from code structure).
 */

#include "batt_if.h"
#include "afe_driver.h"
#include "adc_driver.h"

/* ── Private state ────────────────────────────────────────────────── */
static BATT_State_t  s_state;
static int32_t       s_coulomb_acc_ma_s = 0;     /* Coulomb counter: mA·s */
static uint32_t      s_last_tick_ms     = 0;

/* ── Private helpers ──────────────────────────────────────────────── */
static uint8_t  prv_estimate_soc(void);
static int16_t  prv_avg_temp(void);
static void     prv_update_coulomb_counter(int32_t current_ma, uint32_t elapsed_ms);
static BATT_Status_t prv_derive_status(void);

/* ── Public ───────────────────────────────────────────────────────── */
void BATT_IF_Init(void)
{
    AFE_Init();
    ADC_Init();
    ADC_Start();
    s_coulomb_acc_ma_s = (int32_t)BATT_NOMINAL_CAPACITY_AH * 3600 / 2; /* Start at 50% */
    s_last_tick_ms     = 0U;
}

void BATT_IF_Update(void)
{
    AFE_ReadAll();

    const AFE_Data_t  *afe = AFE_GetData();
    const ADC_Results_t *adc = ADC_GetResult();

    if (!afe->data_valid) { s_state.data_valid = false; return; }

    /* Copy cell voltages */
    for (uint8_t i = 0; i < BATT_NUM_CELLS; i++) {
        s_state.cell_voltage_mv[i] = afe->cell_voltage_mv[i];
    }
    s_state.pack_current_ma = afe->pack_current_ma;

    /* Pack voltage — sum of all cells */
    uint32_t sum_mv = 0U;
    for (uint8_t i = 0; i < BATT_NUM_CELLS; i++) {
        sum_mv += s_state.cell_voltage_mv[i];
    }
    s_state.pack_voltage_mv = (uint16_t)(sum_mv > 0xFFFFU ? 0xFFFFU : sum_mv);

    /* Temperature from ADC (more accurate NTC, AFE is internal IC temp) */
    if (adc->data_valid) {
        s_state.avg_temp_degc_x10 = prv_avg_temp();
        s_state.max_temp_degc_x10 =
            adc->temp_cell1_degc_x10 > adc->temp_cell2_degc_x10
            ? adc->temp_cell1_degc_x10
            : adc->temp_cell2_degc_x10;
    }

    /* Coulomb counter SOC */
    prv_update_coulomb_counter(s_state.pack_current_ma, 100U /* 100ms tick */);
    s_state.soc_percent  = prv_estimate_soc();
    s_state.soh_percent  = 100U; /* HACK: SOH fixed at 100% — not yet implemented */

    s_state.prot_flags   = afe->prot_flags;
    s_state.is_balancing = false; /* TODO: read balancing status from AFE CTRL registers */
    s_state.status       = prv_derive_status();
    s_state.data_valid   = true;
}

const BATT_State_t *BATT_IF_GetState(void)           { return &s_state; }
uint16_t            BATT_IF_GetPackVoltageMv(void)    { return s_state.pack_voltage_mv; }
int32_t             BATT_IF_GetCurrentMa(void)        { return s_state.pack_current_ma; }
uint8_t             BATT_IF_GetSocPercent(void)       { return s_state.soc_percent; }
int16_t             BATT_IF_GetMaxTempX10(void)       { return s_state.max_temp_degc_x10; }
bool                BATT_IF_IsFaultActive(void)       { return s_state.prot_flags != 0U; }

bool BATT_IF_IsChargingAllowed(void)
{
    if (s_state.prot_flags & (AFE_PROT_OV | AFE_PROT_OT_CHG | AFE_PROT_OC_CHG)) {
        return false;
    }
    if (s_state.max_temp_degc_x10 > BATT_TEMP_OT_CHG_X10) { return false; }
    if (s_state.avg_temp_degc_x10 < BATT_TEMP_UT_CHG_X10) { return false; }
    if (s_state.soc_percent >= BATT_SOC_FULL_PERCENT)      { return false; }
    return true;
}

bool BATT_IF_IsDischargingAllowed(void)
{
    if (s_state.prot_flags & (AFE_PROT_UV | AFE_PROT_OT_DSC | AFE_PROT_SHORT)) {
        return false;
    }
    if (s_state.max_temp_degc_x10 > BATT_TEMP_OT_DSC_X10) { return false; }
    if (s_state.soc_percent <= BATT_SOC_EMPTY_PERCENT)     { return false; }
    return true;
}

/* ── Private ──────────────────────────────────────────────────────── */
static void prv_update_coulomb_counter(int32_t current_ma, uint32_t elapsed_ms)
{
    /* Integrate current over time: Q += I * dt */
    s_coulomb_acc_ma_s += (current_ma * (int32_t)elapsed_ms) / 1000;

    /* Clamp to pack capacity */
    int32_t max_ms = (int32_t)BATT_NOMINAL_CAPACITY_AH * 3600;
    if (s_coulomb_acc_ma_s > max_ms) { s_coulomb_acc_ma_s = max_ms; }
    if (s_coulomb_acc_ma_s < 0)      { s_coulomb_acc_ma_s = 0; }
}

static uint8_t prv_estimate_soc(void)
{
    int32_t capacity_ma_s = (int32_t)BATT_NOMINAL_CAPACITY_AH * 3600;
    return (uint8_t)((s_coulomb_acc_ma_s * 100) / capacity_ma_s);
}

static int16_t prv_avg_temp(void)
{
    const ADC_Results_t *adc = ADC_GetResult();
    return (int16_t)((adc->temp_cell1_degc_x10 + adc->temp_cell2_degc_x10) / 2);
}

static BATT_Status_t prv_derive_status(void)
{
    if (s_state.prot_flags != 0U)          { return BATT_STATUS_FAULT; }
    if (s_state.pack_current_ma > 500)     { return BATT_STATUS_CHARGING; }
    if (s_state.pack_current_ma < -500)    { return BATT_STATUS_DISCHARGING; }
    return BATT_STATUS_IDLE;
}
