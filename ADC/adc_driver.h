/**
 * @file    adc_driver.h
 * @brief   ADC peripheral driver — MCAL layer
 * @target  STM32F4xx — ADC1, DMA2 Stream0
 *
 * Samples pack voltage, temperature, and current sense channels
 * continuously via DMA. Results are accessible via ADC_GetResult().
 */

#ifndef ADC_DRIVER_H
#define ADC_DRIVER_H

#include <stdint.h>
#include <stdbool.h>

/* ── Channel assignments ──────────────────────────────────────────── */
#define ADC_CH_PACK_VOLTAGE    0U   /* PA0 — ADC1_IN0 */
#define ADC_CH_CELL_TEMP_1     1U   /* PA1 — ADC1_IN1 */
#define ADC_CH_CELL_TEMP_2     2U   /* PA2 — ADC1_IN2 */
#define ADC_CH_CURRENT_SENSE   3U   /* PA3 — ADC1_IN3 — shunt resistor */
#define ADC_CH_PCB_TEMP        4U   /* PA4 — ADC1_IN4 — onboard NTC */
#define ADC_CHANNEL_COUNT      5U

/* ── Scaling / reference ──────────────────────────────────────────── */
#define ADC_RESOLUTION_BITS    12U
#define ADC_MAX_COUNT          4095U
#define ADC_VREF_MV            3300U   /* 3.3 V reference */
#define ADC_OVERSAMPLE_COUNT   16U     /* Hardware oversampling */

/* ── Voltage divider for pack voltage sense ───────────────────────── */
#define ADC_VPACK_R_HIGH_KOHM  390U    /* Top resistor  */
#define ADC_VPACK_R_LOW_KOHM   10U     /* Bottom resistor (to ADC pin) */
#define ADC_VPACK_SCALE_NUM    (ADC_VPACK_R_HIGH_KOHM + ADC_VPACK_R_LOW_KOHM)
#define ADC_VPACK_SCALE_DEN    ADC_VPACK_R_LOW_KOHM

/* ── Current sense: 75A / 75mV shunt (1 mV = 1 A) ───────────────── */
#define ADC_ISHUNT_GAIN        50U     /* Op-amp gain on shunt signal */
#define ADC_ISHUNT_OFFSET_MV   1650U   /* Midpoint bias for bidirectional */

/* ── Error codes ──────────────────────────────────────────────────── */
#define ADC_OK                 0x00U
#define ADC_ERR_NOT_INIT       0x01U
#define ADC_ERR_DMA_FAULT      0x02U
#define ADC_ERR_OVERRUN        0x03U

/* ── Types ────────────────────────────────────────────────────────── */
typedef struct {
    uint16_t raw[ADC_CHANNEL_COUNT];     /* Raw DMA buffer (oversampled avg) */
    uint32_t pack_voltage_mv;            /* Computed pack voltage in mV */
    int32_t  current_ma;                 /* Signed pack current in mA */
    int16_t  temp_cell1_degc_x10;        /* Cell temp 1, °C × 10 */
    int16_t  temp_cell2_degc_x10;        /* Cell temp 2, °C × 10 */
    int16_t  temp_pcb_degc_x10;          /* PCB temp, °C × 10 */
    bool     data_valid;
} ADC_Results_t;

/* ── Public API ───────────────────────────────────────────────────── */
uint8_t             ADC_Init(void);
uint8_t             ADC_Start(void);
uint8_t             ADC_Stop(void);
const ADC_Results_t *ADC_GetResult(void);
bool                ADC_IsDataFresh(void);
void                ADC_DmaCompleteCallback(void);   /* Called from ISR */
void                ADC_DmaErrorCallback(void);      /* Called from ISR */

#endif /* ADC_DRIVER_H */
