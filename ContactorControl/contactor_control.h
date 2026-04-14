/**
 * @file    contactor_control.h
 * @brief   Contactor control — ASW (Application Software) layer
 *
 * Controls main pack contactors (positive, negative, pre-charge).
 * Implements close sequence with pre-charge ramp to protect capacitors.
 * Reads battery state from BATT_IF and fault state from Battery_Diagnostics.
 */

#ifndef CONTACTOR_CONTROL_H
#define CONTACTOR_CONTROL_H

#include <stdint.h>
#include <stdbool.h>

/* ── Pre-charge parameters ────────────────────────────────────────── */
#define CC_PRECHARGE_TIMEOUT_MS   3000U   /* Max pre-charge time */
#define CC_PRECHARGE_TARGET_PCT   90U     /* Close main when bus = 90% of pack */
#define CC_OPEN_DEBOUNCE_MS       50U     /* Debounce before opening contactors */
#define CC_WELD_CHECK_DELTA_MV    500U    /* If bus stays high after open → weld */

/* ── Contactor state machine states ──────────────────────────────── */
typedef enum {
    CC_STATE_OPEN = 0,       /* All contactors open */
    CC_STATE_PRECHARGE,      /* Pre-charge relay closed, main neg closed */
    CC_STATE_CLOSING,        /* Waiting for bus voltage to ramp */
    CC_STATE_CLOSED,         /* All main contactors closed, system live */
    CC_STATE_OPENING,        /* Ordered open — waiting debounce */
    CC_STATE_FAULT,          /* Fault state — contactors forced open */
    CC_STATE_WELD_DETECTED   /* Contact weld detected — safety lockout */
} CC_State_t;

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    CC_State_t state;
    uint32_t   state_entry_tick;
    bool       main_pos_closed;
    bool       main_neg_closed;
    bool       precharge_closed;
    bool       weld_detected;
    uint8_t    open_request_reason;  /* Fault code that triggered open */
} CC_Status_t;

/* ── Open request reasons ─────────────────────────────────────────── */
#define CC_OPEN_REASON_NONE      0x00U
#define CC_OPEN_REASON_FAULT     0x01U
#define CC_OPEN_REASON_SOC_LOW   0x02U
#define CC_OPEN_REASON_OVERTEMP  0x03U
#define CC_OPEN_REASON_COMMAND   0x04U   /* External close request */

/* ── Public API ───────────────────────────────────────────────────── */
void               CC_Init(void);
void               CC_Tick(void);              /* Call at 10 Hz */
void               CC_RequestClose(void);
void               CC_RequestOpen(uint8_t reason);
const CC_Status_t *CC_GetStatus(void);
CC_State_t         CC_GetState(void);
bool               CC_IsSystemLive(void);

#endif /* CONTACTOR_CONTROL_H */
