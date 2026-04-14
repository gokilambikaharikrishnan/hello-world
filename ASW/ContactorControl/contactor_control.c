/**
 * @file    contactor_control.c
 * @brief   Contactor control state machine — ASW layer
 *
 * State transitions:
 *   OPEN → PRECHARGE (on close request + no fault)
 *   PRECHARGE → CLOSING (pre-charge relay + neg main closed)
 *   CLOSING → CLOSED (bus voltage >= 90% of pack voltage)
 *   CLOSED → OPENING (on fault, open request, or SoC critical)
 *   OPENING → OPEN (after debounce)
 *   any → FAULT (fatal fault detected)
 *   OPEN → WELD_DETECTED (bus still high after confirmed open)
 *
 * NOTE: GPIO control of actual contactors is done via CONTACTOR_IF.
 * This module only runs the state machine logic.
 */

#include "contactor_control.h"
#include "contactor_if.h"
#include "batt_if.h"
#include "battery_diagnostics.h"

/* ── Private state ────────────────────────────────────────────────── */
static CC_Status_t s_status;
static uint32_t    s_tick        = 0U;
static bool        s_close_req   = false;
static uint8_t     s_open_reason = CC_OPEN_REASON_NONE;

/* ── Private helpers ──────────────────────────────────────────────── */
static void prv_enter_state(CC_State_t new_state);
static bool prv_bus_voltage_ready(void);
static bool prv_any_fault_requiring_open(void);
static void prv_apply_contactor_outputs(void);

/* ── Public ───────────────────────────────────────────────────────── */
void CC_Init(void)
{
    CONTACTOR_IF_Init();
    s_status.state              = CC_STATE_OPEN;
    s_status.state_entry_tick   = 0U;
    s_status.main_pos_closed    = false;
    s_status.main_neg_closed    = false;
    s_status.precharge_closed   = false;
    s_status.weld_detected      = false;
    s_status.open_request_reason = CC_OPEN_REASON_NONE;
    s_tick = 0U;
}

void CC_Tick(void)
{
    s_tick++;
    uint32_t elapsed = (s_tick - s_status.state_entry_tick) * 100U; /* 10Hz → ms */

    /* Fatal fault always wins */
    if (DIAG_IsAnyFatalActive() && s_status.state != CC_STATE_FAULT) {
        prv_enter_state(CC_STATE_FAULT);
        return;
    }

    switch (s_status.state) {

        case CC_STATE_OPEN:
            /* Weld check: bus still live after we're open */
            if (BATT_IF_GetPackVoltageMv() > 1000U) {
                s_status.weld_detected = true;
                prv_enter_state(CC_STATE_WELD_DETECTED);
                break;
            }
            if (s_close_req && !prv_any_fault_requiring_open()) {
                s_close_req = false;
                prv_enter_state(CC_STATE_PRECHARGE);
            }
            break;

        case CC_STATE_PRECHARGE:
            s_status.precharge_closed = true;
            s_status.main_neg_closed  = true;
            prv_apply_contactor_outputs();
            prv_enter_state(CC_STATE_CLOSING);
            break;

        case CC_STATE_CLOSING:
            if (prv_bus_voltage_ready()) {
                prv_enter_state(CC_STATE_CLOSED);
            } else if (elapsed >= CC_PRECHARGE_TIMEOUT_MS) {
                /* Pre-charge timed out — open and fault */
                prv_enter_state(CC_STATE_FAULT);
            }
            break;

        case CC_STATE_CLOSED:
            if (prv_any_fault_requiring_open()) {
                CC_RequestOpen(CC_OPEN_REASON_FAULT);
            }
            break;

        case CC_STATE_OPENING:
            if (elapsed >= CC_OPEN_DEBOUNCE_MS) {
                prv_enter_state(CC_STATE_OPEN);
            }
            break;

        case CC_STATE_FAULT:
        case CC_STATE_WELD_DETECTED:
            /* Locked — only external reset can clear */
            break;
    }
}

void CC_RequestClose(void)   { s_close_req   = true; }
void CC_RequestOpen(uint8_t reason)
{
    s_open_reason = reason;
    s_status.open_request_reason = reason;
    if (s_status.state == CC_STATE_CLOSED || s_status.state == CC_STATE_CLOSING) {
        prv_enter_state(CC_STATE_OPENING);
    }
}

const CC_Status_t *CC_GetStatus(void)   { return &s_status; }
CC_State_t         CC_GetState(void)    { return s_status.state; }
bool               CC_IsSystemLive(void){ return s_status.state == CC_STATE_CLOSED; }

/* ── Private ──────────────────────────────────────────────────────── */
static void prv_enter_state(CC_State_t new_state)
{
    s_status.state            = new_state;
    s_status.state_entry_tick = s_tick;

    /* De-energise all on fault/open/weld */
    if (new_state == CC_STATE_OPEN   ||
        new_state == CC_STATE_FAULT  ||
        new_state == CC_STATE_WELD_DETECTED ||
        new_state == CC_STATE_OPENING) {
        s_status.main_pos_closed  = false;
        s_status.main_neg_closed  = false;
        s_status.precharge_closed = false;
        prv_apply_contactor_outputs();
    }

    /* Energise main pos when transitioning to CLOSED */
    if (new_state == CC_STATE_CLOSED) {
        s_status.main_pos_closed  = true;
        s_status.precharge_closed = false;  /* Open pre-charge relay */
        prv_apply_contactor_outputs();
    }
}

static bool prv_bus_voltage_ready(void)
{
    uint32_t bus_mv  = BATT_IF_GetPackVoltageMv();
    uint32_t pack_mv = BATT_IF_GetPackVoltageMv();
    return (bus_mv * 100U) >= (pack_mv * CC_PRECHARGE_TARGET_PCT);
}

static bool prv_any_fault_requiring_open(void)
{
    return DIAG_IsFaultActive(DIAG_FAULT_CELL_OV)   ||
           DIAG_IsFaultActive(DIAG_FAULT_CELL_UV)   ||
           DIAG_IsFaultActive(DIAG_FAULT_OVERTEMP)  ||
           DIAG_IsFaultActive(DIAG_FAULT_OVERCURR_DSC);
}

static void prv_apply_contactor_outputs(void)
{
    CONTACTOR_IF_SetMainPos(s_status.main_pos_closed);
    CONTACTOR_IF_SetMainNeg(s_status.main_neg_closed);
    CONTACTOR_IF_SetPrecharge(s_status.precharge_closed);
}
