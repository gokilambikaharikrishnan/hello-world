/**
 * @file    can_driver.c
 * @brief   CAN peripheral driver — MCAL layer
 *
 * Implements bare-metal CAN1 communication on STM32F4xx.
 * Baud rate: 500 kbps. Uses FIFO0 for reception with interrupt.
 * Transmit uses polling on mailbox availability with timeout.
 *
 * TODO: Add FIFO1 support for priority-based receive filtering
 * TODO: Implement bus-off recovery auto-retry sequence
 */

#include "can_driver.h"
#include "stm32f4xx_hal.h"
#include <string.h>

/* ── Private state ────────────────────────────────────────────────── */
static CAN_HandleTypeDef   s_hcan;
static CAN_State_t         s_state        = CAN_STATE_UNINIT;
static CAN_RxCallback_t    s_rx_callback  = NULL;
static uint32_t            s_bus_err_cnt  = 0U;

/* ── Private helpers ──────────────────────────────────────────────── */
static void prv_gpio_init(void);
static void prv_filter_init(void);

/* ── Public: Init ─────────────────────────────────────────────────── */
uint8_t CAN_Init(void)
{
    if (s_state == CAN_STATE_READY) {
        return CAN_OK;  /* Already initialised — idempotent */
    }

    prv_gpio_init();

    s_hcan.Instance                  = CAN_INSTANCE;
    s_hcan.Init.Prescaler            = 6U;       /* 42 MHz / 6 = 7 MHz time quanta */
    s_hcan.Init.Mode                 = CAN_MODE_NORMAL;
    s_hcan.Init.SyncJumpWidth        = CAN_SJW_1TQ;
    s_hcan.Init.TimeSeg1             = CAN_BS1_11TQ;
    s_hcan.Init.TimeSeg2             = CAN_BS2_2TQ;
    s_hcan.Init.TimeTriggeredMode    = DISABLE;
    s_hcan.Init.AutoBusOff           = ENABLE;   /* HW auto bus-off recovery */
    s_hcan.Init.AutoWakeUp           = DISABLE;
    s_hcan.Init.AutoRetransmission   = ENABLE;
    s_hcan.Init.ReceiveFifoLocked    = DISABLE;
    s_hcan.Init.TransmitFifoPriority = DISABLE;

    if (HAL_CAN_Init(&s_hcan) != HAL_OK) {
        s_state = CAN_STATE_ERROR;
        return CAN_ERR_NOT_INIT;
    }

    prv_filter_init();

    if (HAL_CAN_Start(&s_hcan) != HAL_OK) {
        s_state = CAN_STATE_ERROR;
        return CAN_ERR_NOT_INIT;
    }

    HAL_CAN_ActivateNotification(&s_hcan,
        CAN_IT_RX_FIFO0_MSG_PENDING | CAN_IT_ERROR | CAN_IT_BUSOFF);

    s_state     = CAN_STATE_READY;
    s_bus_err_cnt = 0U;
    return CAN_OK;
}

/* ── Public: Transmit ─────────────────────────────────────────────── */
uint8_t CAN_Transmit(const CAN_Frame_t *frame)
{
    if (s_state != CAN_STATE_READY) { return CAN_ERR_NOT_INIT; }
    if (frame == NULL || frame->dlc > CAN_MAX_DLC) { return CAN_ERR_NO_MAILBOX; }

    CAN_TxHeaderTypeDef tx_hdr = {
        .StdId = frame->is_extended ? 0U : frame->id,
        .ExtId = frame->is_extended ? frame->id : 0U,
        .IDE   = frame->is_extended ? CAN_ID_EXT : CAN_ID_STD,
        .RTR   = frame->is_rtr ? CAN_RTR_REMOTE : CAN_RTR_DATA,
        .DLC   = frame->dlc,
        .TransmitGlobalTime = DISABLE
    };

    uint32_t mailbox;
    uint32_t timeout = CAN_TX_TIMEOUT_MS * 1000U;  /* crude spin counter */

    while (HAL_CAN_GetTxMailboxesFreeLevel(&s_hcan) == 0U) {
        if (--timeout == 0U) { return CAN_ERR_TIMEOUT; }
    }

    if (HAL_CAN_AddTxMessage(&s_hcan, &tx_hdr, frame->data, &mailbox) != HAL_OK) {
        return CAN_ERR_NO_MAILBOX;
    }

    return CAN_OK;
}

/* ── Public: Filter setup ─────────────────────────────────────────── */
uint8_t CAN_SetFilter(uint32_t filter_id, uint32_t filter_mask)
{
    CAN_FilterTypeDef filter = {
        .FilterIdHigh         = (uint16_t)(filter_id >> 16U),
        .FilterIdLow          = (uint16_t)(filter_id & 0xFFFFU),
        .FilterMaskIdHigh     = (uint16_t)(filter_mask >> 16U),
        .FilterMaskIdLow      = (uint16_t)(filter_mask & 0xFFFFU),
        .FilterFIFOAssignment = CAN_FILTER_FIFO0,
        .FilterBank           = CAN_RX_FILTER_BANK,
        .FilterMode           = CAN_FILTERMODE_IDMASK,
        .FilterScale          = CAN_FILTERSCALE_32BIT,
        .FilterActivation     = CAN_FILTER_ENABLE,
        .SlaveStartFilterBank = 14U
    };
    HAL_CAN_ConfigFilter(&s_hcan, &filter);
    return CAN_OK;
}

/* ── Public: Rx callback registration ────────────────────────────── */
void CAN_RegisterRxCallback(CAN_RxCallback_t callback)
{
    s_rx_callback = callback;
}

/* ── Public: State / diagnostics ─────────────────────────────────── */
CAN_State_t CAN_GetState(void)    { return s_state; }
uint32_t    CAN_GetBusErrorCount(void) { return s_bus_err_cnt; }

/* ── ISR callbacks (called from HAL interrupt handlers) ──────────── */
void CAN_RxFifo0MsgPendingCallback(void)
{
    CAN_RxHeaderTypeDef rx_hdr;
    CAN_Frame_t         frame;

    if (HAL_CAN_GetRxMessage(&s_hcan, CAN_RX_FIFO, &rx_hdr, frame.data) == HAL_OK) {
        frame.id          = rx_hdr.IDE == CAN_ID_EXT ? rx_hdr.ExtId : rx_hdr.StdId;
        frame.dlc         = (uint8_t)rx_hdr.DLC;
        frame.is_extended = (rx_hdr.IDE == CAN_ID_EXT);
        frame.is_rtr      = (rx_hdr.RTR == CAN_RTR_REMOTE);

        if (s_rx_callback != NULL) {
            s_rx_callback(&frame);
        }
    }
}

void CAN_ErrorCallback(void)
{
    s_bus_err_cnt++;
    uint32_t err = HAL_CAN_GetError(&s_hcan);
    if (err & HAL_CAN_ERROR_BOF) {
        s_state = CAN_STATE_BUS_OFF;
    }
}

/* ── Private: GPIO init for CAN1 (PB8=RX, PB9=TX on STM32F4) ─────── */
static void prv_gpio_init(void)
{
    __HAL_RCC_CAN1_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();

    GPIO_InitTypeDef gpio = {
        .Pin       = GPIO_PIN_8 | GPIO_PIN_9,
        .Mode      = GPIO_MODE_AF_PP,
        .Pull      = GPIO_NOPULL,
        .Speed     = GPIO_SPEED_FREQ_VERY_HIGH,
        .Alternate = GPIO_AF9_CAN1
    };
    HAL_GPIO_Init(GPIOB, &gpio);
}

/* ── Private: Accept-all filter on startup ────────────────────────── */
static void prv_filter_init(void)
{
    CAN_SetFilter(0x00000000U, 0x00000000U);
}
