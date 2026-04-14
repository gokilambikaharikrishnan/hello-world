/**
 * @file    batt_if.h
 * @brief   Battery interface — ESAL layer
 *
 * Abstraction layer between the AFE/ADC drivers (CDD/MCAL) and the
 * application software (ASW). Provides a unified view of battery state
 * without exposing hardware-specific details to the application.
 */

#ifndef BATT_IF_H
#define BATT_IF_H

#include <stdint.h>
#include <stdbool.h>
#include "afe_driver.h"

/* ── Pack geometry ────────────────────────────────────────────────── */
#define BATT_NUM_CELLS           14U
#define BATT_NOMINAL_CAPACITY_AH 314U
#define BATT_MAX_VOLTAGE_MV      51100U   /* 14 × 3650 mV */
#define BATT_MIN_VOLTAGE_MV      39200U   /* 14 × 2800 mV */
#define BATT_MAX_CHARGE_CURR_MA  75000    /* +75 A */
#define BATT_MAX_DISCHARGE_CURR  75000    /* -75 A */

/* ── Thermal limits ───────────────────────────────────────────────── */
#define BATT_TEMP_OT_CHG_X10     450      /* 45.0 °C charge cutoff */
#define BATT_TEMP_OT_DSC_X10     600      /* 60.0 °C discharge cutoff */
#define BATT_TEMP_UT_CHG_X10     0        /*  0.0 °C low-temp charge cutoff */

/* ── SOC estimation limits ────────────────────────────────────────── */
#define BATT_SOC_FULL_PERCENT    100U
#define BATT_SOC_EMPTY_PERCENT   0U
#define BATT_SOC_LOW_WARN_PCT    15U
#define BATT_SOC_CRITICAL_PCT    5U

/* ── Types ────────────────────────────────────────────────────────── */
typedef enum {
    BATT_STATUS_OK = 0,
    BATT_STATUS_CHARGING,
    BATT_STATUS_DISCHARGING,
    BATT_STATUS_IDLE,
    BATT_STATUS_FAULT,
    BATT_STATUS_UNKNOWN
} BATT_Status_t;

typedef struct {
    uint16_t     cell_voltage_mv[BATT_NUM_CELLS];
    uint16_t     pack_voltage_mv;
    int32_t      pack_current_ma;    /* + = charging, - = discharging */
    uint8_t      soc_percent;
    uint8_t      soh_percent;
    int16_t      avg_temp_degc_x10;
    int16_t      max_temp_degc_x10;
    BATT_Status_t status;
    uint8_t      prot_flags;
    bool         is_balancing;
    bool         data_valid;
} BATT_State_t;

/* ── Public API ───────────────────────────────────────────────────── */
void                 BATT_IF_Init(void);
void                 BATT_IF_Update(void);           /* Call each scheduler tick */
const BATT_State_t  *BATT_IF_GetState(void);
uint16_t             BATT_IF_GetPackVoltageMv(void);
int32_t              BATT_IF_GetCurrentMa(void);
uint8_t              BATT_IF_GetSocPercent(void);
int16_t              BATT_IF_GetMaxTempX10(void);
bool                 BATT_IF_IsFaultActive(void);
bool                 BATT_IF_IsChargingAllowed(void);
bool                 BATT_IF_IsDischargingAllowed(void);

#endif /* BATT_IF_H */
