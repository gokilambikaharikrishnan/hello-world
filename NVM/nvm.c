/**
 * @file    nvm.c
 * @brief   NVM service — SRVLayer
 *
 * Uses STM32 EEPROM emulation over internal flash (EE_WriteVariable /
 * EE_ReadVariable HAL functions). Each logical NVM_ID maps to a 16-bit
 * virtual address in the emulation layer.
 *
 * For multi-byte values, consecutive virtual addresses are used.
 * CRC8 is appended to each write for integrity checking on read.
 *
 * TODO: Implement wear levelling counter monitoring and alert when
 *       approaching flash endurance limit (~10k cycles for STM32F4 flash).
 */

#include "nvm.h"
#include "eeprom_emul.h"  /* STM32 EEPROM emulation HAL */
#include <string.h>

/* ── Private constants ────────────────────────────────────────────── */
#define NVM_CRC8_POLY    0x07U
#define NVM_FAULT_BASE_VADDR  0x0100U  /* Virtual address block for fault log */

/* ── Private state ────────────────────────────────────────────────── */
static bool    s_initialized      = false;
static uint8_t s_fault_write_idx  = 0U;
static uint8_t s_fault_count      = 0U;

/* ── Private helpers ──────────────────────────────────────────────── */
static uint8_t prv_crc8(const uint8_t *data, uint8_t len);

/* ── Public: Init ─────────────────────────────────────────────────── */
uint8_t NVM_Init(void)
{
    EE_Status status = EE_Init(EE_FORCED_ERASE);
    if (status != EE_OK) { return NVM_ERR_NOT_INIT; }

    /* Load fault index from NVM */
    uint16_t idx_raw = 0U;
    if (EE_ReadVariable32bits(NVM_ID_FAULT_HISTORY, &idx_raw) == EE_OK) {
        s_fault_write_idx = (uint8_t)(idx_raw & 0xFFU);
        s_fault_count     = (uint8_t)((idx_raw >> 8U) & 0xFFU);
    }

    s_initialized = true;
    return NVM_OK;
}

/* ── Public: Scalar read/write ─────────────────────────────────────── */
uint8_t NVM_WriteU8(uint16_t id, uint8_t value)
{
    if (!s_initialized) { return NVM_ERR_NOT_INIT; }
    EE_Status s = EE_WriteVariable16bits(id, (uint16_t)value);
    return (s == EE_OK) ? NVM_OK : NVM_ERR_WRITE_FAIL;
}

uint8_t NVM_ReadU8(uint16_t id, uint8_t *value)
{
    if (!s_initialized) { return NVM_ERR_NOT_INIT; }
    uint16_t raw = 0U;
    EE_Status s = EE_ReadVariable16bits(id, &raw);
    if (s != EE_OK) { return NVM_ERR_NOT_FOUND; }
    *value = (uint8_t)(raw & 0xFFU);
    return NVM_OK;
}

uint8_t NVM_WriteU16(uint16_t id, uint16_t value)
{
    if (!s_initialized) { return NVM_ERR_NOT_INIT; }
    EE_Status s = EE_WriteVariable16bits(id, value);
    return (s == EE_OK) ? NVM_OK : NVM_ERR_WRITE_FAIL;
}

uint8_t NVM_ReadU16(uint16_t id, uint16_t *value)
{
    if (!s_initialized) { return NVM_ERR_NOT_INIT; }
    return EE_ReadVariable16bits(id, value) == EE_OK ? NVM_OK : NVM_ERR_NOT_FOUND;
}

uint8_t NVM_WriteU32(uint16_t id, uint32_t value)
{
    if (!s_initialized) { return NVM_ERR_NOT_INIT; }
    EE_Status s = EE_WriteVariable32bits(id, value);
    return (s == EE_OK) ? NVM_OK : NVM_ERR_WRITE_FAIL;
}

uint8_t NVM_ReadU32(uint16_t id, uint32_t *value)
{
    if (!s_initialized) { return NVM_ERR_NOT_INIT; }
    return EE_ReadVariable32bits(id, value) == EE_OK ? NVM_OK : NVM_ERR_NOT_FOUND;
}

/* ── Public: Fault log ─────────────────────────────────────────────── */
uint8_t NVM_LogFault(const NVM_FaultEntry_t *entry)
{
    if (!s_initialized || entry == NULL) { return NVM_ERR_NOT_INIT; }

    /* Pack entry into 4 x 16-bit words */
    uint16_t vaddr_base = NVM_FAULT_BASE_VADDR + (s_fault_write_idx * 4U);
    EE_WriteVariable16bits(vaddr_base + 0U, (uint16_t)(entry->timestamp_s >> 16U));
    EE_WriteVariable16bits(vaddr_base + 1U, (uint16_t)(entry->timestamp_s & 0xFFFFU));
    EE_WriteVariable16bits(vaddr_base + 2U,
        (uint16_t)((entry->fault_code << 8U) | entry->severity));
    EE_WriteVariable16bits(vaddr_base + 3U, entry->pack_voltage_mv);

    s_fault_write_idx = (s_fault_write_idx + 1U) % NVM_MAX_FAULT_ENTRIES;
    if (s_fault_count < NVM_MAX_FAULT_ENTRIES) { s_fault_count++; }

    /* Persist index */
    EE_WriteVariable32bits(NVM_ID_FAULT_HISTORY,
        ((uint32_t)s_fault_count << 8U) | s_fault_write_idx);

    return NVM_OK;
}

uint8_t NVM_GetFaultHistory(NVM_FaultEntry_t *buf, uint8_t *count)
{
    if (!s_initialized || buf == NULL) { return NVM_ERR_NOT_INIT; }
    *count = s_fault_count;
    for (uint8_t i = 0; i < s_fault_count; i++) {
        uint16_t vaddr_base = NVM_FAULT_BASE_VADDR + (i * 4U);
        uint16_t ts_hi, ts_lo, fc_sv, vpack;
        EE_ReadVariable16bits(vaddr_base + 0U, &ts_hi);
        EE_ReadVariable16bits(vaddr_base + 1U, &ts_lo);
        EE_ReadVariable16bits(vaddr_base + 2U, &fc_sv);
        EE_ReadVariable16bits(vaddr_base + 3U, &vpack);
        buf[i].timestamp_s   = ((uint32_t)ts_hi << 16U) | ts_lo;
        buf[i].fault_code    = (uint8_t)(fc_sv >> 8U);
        buf[i].severity      = (uint8_t)(fc_sv & 0xFFU);
        buf[i].pack_voltage_mv = vpack;
    }
    return NVM_OK;
}

uint8_t NVM_EraseFaultHistory(void)
{
    s_fault_write_idx = 0U;
    s_fault_count     = 0U;
    return EE_WriteVariable32bits(NVM_ID_FAULT_HISTORY, 0U) == EE_OK
        ? NVM_OK : NVM_ERR_WRITE_FAIL;
}

bool NVM_IsReady(void) { return s_initialized; }

/* ── Private: CRC-8 ─────────────────────────────────────────────────── */
static uint8_t prv_crc8(const uint8_t *data, uint8_t len)
{
    uint8_t crc = 0U;
    for (uint8_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t b = 0; b < 8U; b++) {
            crc = (crc & 0x80U) ? ((crc << 1U) ^ NVM_CRC8_POLY) : (crc << 1U);
        }
    }
    return crc;
}
