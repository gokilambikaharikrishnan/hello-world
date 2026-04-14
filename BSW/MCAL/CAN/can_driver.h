/**
 * @file    can_driver.h
 * @brief   CAN peripheral driver — MCAL layer
 * @target  STM32F4xx
 */

#ifndef CAN_DRIVER_H
#define CAN_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

/* ── Configuration ─────────────────────────────────────────────────── */
#define CAN_INSTANCE          CAN1
#define CAN_BAUD_RATE         500000U    /* 500 kbps */
#define CAN_TX_TIMEOUT_MS     10U
#define CAN_RX_FIFO           CAN_RX_FIFO0
#define CAN_TX_MAILBOX_COUNT  3U
#define CAN_RX_FILTER_BANK    0U
#define CAN_MAX_DLC           8U

/* ── Peripheral base addresses (STM32F4) ─────────────────────────── */
#define CAN1_BASE_ADDR        0x40006400UL
#define CAN_MCR_OFFSET        0x000UL     /* Master control register */
#define CAN_TSR_OFFSET        0x008UL     /* Transmit status register */
#define CAN_RF0R_OFFSET       0x00CUL     /* Receive FIFO 0 register */
#define CAN_IER_OFFSET        0x014UL     /* Interrupt enable register */

/* ── Error codes ──────────────────────────────────────────────────── */
#define CAN_OK                0x00U
#define CAN_ERR_TIMEOUT       0x01U
#define CAN_ERR_NO_MAILBOX    0x02U
#define CAN_ERR_BUS_OFF       0x03U
#define CAN_ERR_PASSIVE       0x04U
#define CAN_ERR_NOT_INIT      0x05U

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    uint32_t id;        /* Standard (11-bit) or extended (29-bit) ID */
    uint8_t  dlc;       /* Data length code: 0–8 */
    uint8_t  data[CAN_MAX_DLC];
    bool     is_extended;
    bool     is_rtr;
} CAN_Frame_t;

typedef enum {
    CAN_STATE_UNINIT = 0,
    CAN_STATE_INIT,
    CAN_STATE_READY,
    CAN_STATE_BUS_OFF,
    CAN_STATE_ERROR
} CAN_State_t;

typedef void (*CAN_RxCallback_t)(const CAN_Frame_t *frame);

/* ── Public API ───────────────────────────────────────────────────── */
uint8_t     CAN_Init(void);
uint8_t     CAN_DeInit(void);
uint8_t     CAN_Transmit(const CAN_Frame_t *frame);
uint8_t     CAN_SetFilter(uint32_t filter_id, uint32_t filter_mask);
void        CAN_RegisterRxCallback(CAN_RxCallback_t callback);
CAN_State_t CAN_GetState(void);
uint32_t    CAN_GetBusErrorCount(void);
void        CAN_RxFifo0MsgPendingCallback(void);  /* Called from ISR */
void        CAN_ErrorCallback(void);               /* Called from ISR */

#endif /* CAN_DRIVER_H */
