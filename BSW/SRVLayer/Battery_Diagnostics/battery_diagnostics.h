/**
 * @file    battery_diagnostics.h
 * @brief   Battery diagnostics service — SRVLayer
 *
 * Monitors battery health, detects faults, and logs diagnostic events.
 * Runs at 10 Hz tick rate. Reads from BATT_IF and writes to NVM.
 */

#ifndef BATTERY_DIAGNOSTICS_H
#define BATTERY_DIAGNOSTICS_H

#include <stdint.h>
#include <stdbool.h>

/* ── Fault codes ──────────────────────────────────────────────────── */
#define DIAG_FAULT_NONE          0x00U
#define DIAG_FAULT_CELL_OV       0x01U   /* Cell overvoltage */
#define DIAG_FAULT_CELL_UV       0x02U   /* Cell undervoltage */
#define DIAG_FAULT_OVERTEMP      0x03U   /* Overtemperature */
#define DIAG_FAULT_UNDERTEMP     0x04U   /* Undertemperature */
#define DIAG_FAULT_OVERCURR_CHG  0x05U   /* Overcurrent charge */
#define DIAG_FAULT_OVERCURR_DSC  0x06U   /* Overcurrent discharge */
#define DIAG_FAULT_IMBALANCE     0x07U   /* Cell imbalance > threshold */
#define DIAG_FAULT_COMM_AFE      0x08U   /* AFE communication loss */
#define DIAG_FAULT_NVM           0x09U   /* NVM write failure */

/* ── Fault severity ───────────────────────────────────────────────── */
#define DIAG_SEV_INFO            0x00U
#define DIAG_SEV_WARNING         0x01U
#define DIAG_SEV_CRITICAL        0x02U
#define DIAG_SEV_FATAL           0x03U

/* ── Thresholds ───────────────────────────────────────────────────── */
#define DIAG_CELL_IMBALANCE_MV   50U     /* Flag if max-min > 50 mV */
#define DIAG_DEBOUNCE_TICKS      5U      /* Fault must persist N ticks */

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    uint8_t  active_fault;
    uint8_t  severity;
    uint32_t fault_set_tick;
    bool     fault_latched;
} DIAG_FaultState_t;

typedef struct {
    DIAG_FaultState_t faults[10];
    uint8_t           fault_count;
    uint32_t          total_faults_lifetime;
    bool              any_fatal;
} DIAG_Status_t;

/* ── Public API ───────────────────────────────────────────────────── */
void                  DIAG_Init(void);
void                  DIAG_Tick(void);    /* Call at 10 Hz */
const DIAG_Status_t  *DIAG_GetStatus(void);
bool                  DIAG_IsFaultActive(uint8_t fault_code);
bool                  DIAG_IsAnyFatalActive(void);
void                  DIAG_ClearFault(uint8_t fault_code);
void                  DIAG_ClearAllFaults(void);

#endif /* BATTERY_DIAGNOSTICS_H */
