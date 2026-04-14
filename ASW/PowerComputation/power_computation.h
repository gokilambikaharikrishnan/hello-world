/**
 * @file    power_computation.h
 * @brief   Power computation — ASW layer
 *
 * Computes instantaneous power, energy throughput, and dynamic
 * power limits for the BMS pack. Feeds data to upper-level
 * power management services and CAN reporting.
 */

#ifndef POWER_COMPUTATION_H
#define POWER_COMPUTATION_H

#include <stdint.h>
#include <stdbool.h>

/* ── Limits ───────────────────────────────────────────────────────── */
#define PWRCOMP_MAX_CHG_PWR_W    3750U    /* 75A × 50V max */
#define PWRCOMP_MAX_DSC_PWR_W    3750U
#define PWRCOMP_ENERGY_SCALE     1000U    /* Store Wh × 1000 for precision */
#define PWRCOMP_TICK_PERIOD_MS   100U     /* 10 Hz tick period */

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    int32_t  instantaneous_power_w;     /* Positive = charging */
    uint32_t energy_charged_wh_x1000;   /* Lifetime energy in */
    uint32_t energy_discharged_wh_x1000;/* Lifetime energy out */
    uint32_t max_charge_power_w;        /* Dynamic limit */
    uint32_t max_discharge_power_w;     /* Dynamic limit */
    uint32_t session_energy_wh_x1000;   /* Since last power-up */
    bool     data_valid;
} PWRCOMP_Result_t;

/* ── Public API ───────────────────────────────────────────────────── */
void                    PWRCOMP_Init(void);
void                    PWRCOMP_Tick(void);       /* 10 Hz */
const PWRCOMP_Result_t *PWRCOMP_GetResult(void);
uint32_t                PWRCOMP_GetMaxChargePowerW(void);
uint32_t                PWRCOMP_GetMaxDischargePowerW(void);
int32_t                 PWRCOMP_GetInstantPowerW(void);

#endif /* POWER_COMPUTATION_H */
