/**
 * @file    afe_driver.h
 * @brief   Analog Front End driver — CDD layer
 * @target  STM32F4xx + external AFE IC via SPI
 *
 * Interfaces with the battery AFE IC (inferred from code: ISL94202-compatible
 * register set). Reads per-cell voltages, temperatures, and protection status.
 * Communicates over SPI1 at 1 MHz.
 */

#ifndef AFE_DRIVER_H
#define AFE_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

/* ── Hardware config ──────────────────────────────────────────────── */
#define AFE_SPI_INSTANCE         SPI1
#define AFE_SPI_BAUD_PRESCALER   SPI_BAUDRATEPRESCALER_64   /* ~1 MHz @ 64 MHz */
#define AFE_CS_PORT              GPIOA
#define AFE_CS_PIN               GPIO_PIN_15
#define AFE_NUM_CELLS            14U    /* 14S LFP pack */
#define AFE_CELL_UV_THRESHOLD_MV 2800U  /* Under-voltage threshold per cell */
#define AFE_CELL_OV_THRESHOLD_MV 3650U  /* Over-voltage threshold per cell */
#define AFE_COMM_TIMEOUT_MS      5U

/* ── Register map (ISL94202-compatible subset) ────────────────────── */
#define AFE_REG_CELL_V1_L        0x00U  /* Cell 1 voltage low byte */
#define AFE_REG_CELL_V1_H        0x01U  /* Cell 1 voltage high byte */
/* Cells 2–14 follow sequentially (+2 per cell) */
#define AFE_REG_PACK_CURRENT_L   0x1CU
#define AFE_REG_PACK_CURRENT_H   0x1DU
#define AFE_REG_INT_TEMP_L       0x1EU
#define AFE_REG_INT_TEMP_H       0x1FU
#define AFE_REG_STATUS1          0x20U
#define AFE_REG_STATUS2          0x21U
#define AFE_REG_PROT_STATUS      0x22U  /* Protection flag register */
#define AFE_REG_OV_THRES_L       0x30U
#define AFE_REG_UV_THRES_L       0x32U
#define AFE_REG_CTRL1            0x40U
#define AFE_REG_CTRL2            0x41U

/* ── Protection status bits (REG_PROT_STATUS) ────────────────────── */
#define AFE_PROT_OV              (1U << 0)  /* Cell overvoltage */
#define AFE_PROT_UV              (1U << 1)  /* Cell undervoltage */
#define AFE_PROT_OT_CHG          (1U << 2)  /* Overtemp during charge */
#define AFE_PROT_OT_DSC          (1U << 3)  /* Overtemp during discharge */
#define AFE_PROT_OC_CHG          (1U << 4)  /* Overcurrent charge */
#define AFE_PROT_OC_DSC          (1U << 5)  /* Overcurrent discharge */
#define AFE_PROT_SHORT           (1U << 6)  /* Short circuit */
#define AFE_PROT_OPEN_WIRE       (1U << 7)  /* Open wire detected */

/* ── Error codes ──────────────────────────────────────────────────── */
#define AFE_OK                   0x00U
#define AFE_ERR_SPI              0x01U
#define AFE_ERR_TIMEOUT          0x02U
#define AFE_ERR_CRC              0x03U
#define AFE_ERR_NOT_INIT         0x04U

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    uint16_t cell_voltage_mv[AFE_NUM_CELLS]; /* Per-cell voltage, mV */
    uint16_t min_cell_mv;
    uint16_t max_cell_mv;
    uint16_t cell_delta_mv;                  /* max - min */
    int32_t  pack_current_ma;                /* Positive = charging */
    int16_t  internal_temp_degc_x10;
    uint8_t  prot_flags;                     /* AFE_PROT_xxx bitmask */
    bool     data_valid;
} AFE_Data_t;

/* ── Public API ───────────────────────────────────────────────────── */
uint8_t          AFE_Init(void);
uint8_t          AFE_ReadAll(void);
const AFE_Data_t *AFE_GetData(void);
uint8_t          AFE_ReadRegister(uint8_t reg, uint8_t *value);
uint8_t          AFE_WriteRegister(uint8_t reg, uint8_t value);
uint8_t          AFE_SetProtectionThresholds(uint16_t ov_mv, uint16_t uv_mv);
bool             AFE_IsProtectionActive(uint8_t prot_mask);
void             AFE_ForceBalancing(uint16_t cell_bitmask);  /* NOTE: debug use only */

#endif /* AFE_DRIVER_H */
