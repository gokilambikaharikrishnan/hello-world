/**
 * @file    nvm.h
 * @brief   Non-Volatile Memory service — SRVLayer
 *
 * Provides structured read/write access to persistent storage
 * (internal STM32 flash emulation via EE_xxx HAL layer).
 * Stores SOC, SOH, fault history, calibration, and configuration.
 */

#ifndef NVM_H
#define NVM_H

#include <stdint.h>
#include <stdbool.h>

/* ── NVM block IDs ────────────────────────────────────────────────── */
#define NVM_ID_SOC_PERCENT       0x0001U
#define NVM_ID_SOH_PERCENT       0x0002U
#define NVM_ID_CYCLE_COUNT       0x0003U
#define NVM_ID_FAULT_HISTORY     0x0010U  /* Array of last 32 fault codes */
#define NVM_ID_CALIB_CURR_OFFSET 0x0020U  /* Current sensor zero-offset */
#define NVM_ID_CALIB_VOLT_SCALE  0x0021U  /* Voltage scaling correction */
#define NVM_ID_CONFIG_FLAGS      0x0030U

/* ── Capacity / layout ────────────────────────────────────────────── */
#define NVM_FLASH_BASE_ADDR      0x08060000UL   /* Sector 7, STM32F4 */
#define NVM_FLASH_SIZE_BYTES     0x20000U       /* 128 KB */
#define NVM_MAX_FAULT_ENTRIES    32U
#define NVM_WRITE_TIMEOUT_MS     50U

/* ── Error codes ──────────────────────────────────────────────────── */
#define NVM_OK                   0x00U
#define NVM_ERR_NOT_INIT         0x01U
#define NVM_ERR_INVALID_ID       0x02U
#define NVM_ERR_WRITE_FAIL       0x03U
#define NVM_ERR_CRC              0x04U
#define NVM_ERR_NOT_FOUND        0x05U

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    uint32_t timestamp_s;
    uint8_t  fault_code;
    uint8_t  severity;
    uint16_t pack_voltage_mv;
    int16_t  temperature_x10;
} NVM_FaultEntry_t;

/* ── Public API ───────────────────────────────────────────────────── */
uint8_t NVM_Init(void);
uint8_t NVM_WriteU8(uint16_t id, uint8_t value);
uint8_t NVM_ReadU8(uint16_t id, uint8_t *value);
uint8_t NVM_WriteU16(uint16_t id, uint16_t value);
uint8_t NVM_ReadU16(uint16_t id, uint16_t *value);
uint8_t NVM_WriteU32(uint16_t id, uint32_t value);
uint8_t NVM_ReadU32(uint16_t id, uint32_t *value);
uint8_t NVM_LogFault(const NVM_FaultEntry_t *entry);
uint8_t NVM_GetFaultHistory(NVM_FaultEntry_t *buf, uint8_t *count);
uint8_t NVM_EraseFaultHistory(void);
bool    NVM_IsReady(void);

#endif /* NVM_H */
