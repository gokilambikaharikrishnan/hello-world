/**
 * @file    battery_diagnostics.c
 * @brief   Battery diagnostics — SRVLayer
 *
 * Each fault is debounced over DIAG_DEBOUNCE_TICKS before being latched.
 * Fatal faults are never auto-cleared — require explicit ClearFault call.
 * All latched faults are logged to NVM via NVM_LogFault().
 */

#include "battery_diagnostics.h"
#include "batt_if.h"
#include "nvm.h"
#include <string.h>

/* ── Private state ────────────────────────────────────────────────── */
static DIAG_Status_t s_status;
static uint32_t      s_tick = 0U;
static uint8_t       s_debounce[10] = {0};

/* ── Private helpers ──────────────────────────────────────────────── */
static void prv_check_fault(uint8_t code, bool condition, uint8_t severity);
static void prv_latch_fault(uint8_t code, uint8_t severity);

/* ── Public ───────────────────────────────────────────────────────── */
void DIAG_Init(void)
{
    memset(&s_status, 0, sizeof(s_status));
    memset(s_debounce, 0, sizeof(s_debounce));
    s_tick = 0U;
}

void DIAG_Tick(void)
{
    s_tick++;
    const BATT_State_t *batt = BATT_IF_GetState();
    if (!batt->data_valid) { return; }

    /* Check each fault condition */
    prv_check_fault(DIAG_FAULT_CELL_OV,
        (batt->prot_flags & 0x01U) != 0U, DIAG_SEV_CRITICAL);

    prv_check_fault(DIAG_FAULT_CELL_UV,
        (batt->prot_flags & 0x02U) != 0U, DIAG_SEV_CRITICAL);

    prv_check_fault(DIAG_FAULT_OVERTEMP,
        batt->max_temp_degc_x10 > 600, DIAG_SEV_CRITICAL);

    prv_check_fault(DIAG_FAULT_OVERCURR_DSC,
        batt->pack_current_ma < -75500, DIAG_SEV_FATAL);

    prv_check_fault(DIAG_FAULT_IMBALANCE,
        /* inferred: cell_delta_mv not directly in BATT_State_t, use AFE */
        false, DIAG_SEV_WARNING);  /* TODO: wire up AFE cell_delta_mv */
}

const DIAG_Status_t *DIAG_GetStatus(void)              { return &s_status; }
bool                 DIAG_IsAnyFatalActive(void)        { return s_status.any_fatal; }

bool DIAG_IsFaultActive(uint8_t code)
{
    for (uint8_t i = 0; i < s_status.fault_count; i++) {
        if (s_status.faults[i].active_fault == code &&
            s_status.faults[i].fault_latched) {
            return true;
        }
    }
    return false;
}

void DIAG_ClearFault(uint8_t code)
{
    for (uint8_t i = 0; i < s_status.fault_count; i++) {
        if (s_status.faults[i].active_fault == code) {
            if (s_status.faults[i].severity != DIAG_SEV_FATAL) {
                s_status.faults[i].fault_latched = false;
                s_status.faults[i].active_fault  = DIAG_FAULT_NONE;
            }
        }
    }
}

void DIAG_ClearAllFaults(void)
{
    for (uint8_t i = 0; i < 10U; i++) {
        if (s_status.faults[i].severity != DIAG_SEV_FATAL) {
            s_status.faults[i].fault_latched = false;
        }
    }
}

/* ── Private ──────────────────────────────────────────────────────── */
static void prv_check_fault(uint8_t code, bool condition, uint8_t severity)
{
    if (condition) {
        s_debounce[code]++;
        if (s_debounce[code] >= DIAG_DEBOUNCE_TICKS) {
            prv_latch_fault(code, severity);
        }
    } else {
        s_debounce[code] = 0U;
    }
}

static void prv_latch_fault(uint8_t code, uint8_t severity)
{
    if (DIAG_IsFaultActive(code)) { return; }  /* Already latched */

    if (s_status.fault_count < 10U) {
        DIAG_FaultState_t *f = &s_status.faults[s_status.fault_count++];
        f->active_fault  = code;
        f->severity      = severity;
        f->fault_set_tick = s_tick;
        f->fault_latched = true;

        if (severity == DIAG_SEV_FATAL) { s_status.any_fatal = true; }

        /* Log to NVM */
        NVM_FaultEntry_t entry = {
            .timestamp_s   = s_tick / 10U,  /* ticks to seconds (10 Hz) */
            .fault_code    = code,
            .severity      = severity,
            .pack_voltage_mv = (uint16_t)BATT_IF_GetPackVoltageMv(),
            .temperature_x10 = BATT_IF_GetMaxTempX10()
        };
        NVM_LogFault(&entry);
        s_status.total_faults_lifetime++;
    }
}
