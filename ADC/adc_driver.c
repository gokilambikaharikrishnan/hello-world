/**
 * @file    adc_driver.c
 * @brief   ADC1 + DMA2 continuous scan driver
 *
 * Runs ADC1 in continuous scan mode across 5 channels using DMA2 Stream0.
 * After each full DMA transfer, raw values are scaled to engineering units.
 *
 * NTC temperature conversion uses a 10-point lookup table derived from
 * Murata NCP15XH103 datasheet (10 kΩ NTC, β = 3380 K).
 *
 * FIXME: Current sense baseline calibration not yet implemented.
 *        Using fixed offset ADC_ISHUNT_OFFSET_MV — must be calibrated at
 *        factory for each board.
 */

#include "adc_driver.h"
#include "stm32f4xx_hal.h"

/* ── Private state ────────────────────────────────────────────────── */
static ADC_HandleTypeDef s_hadc;
static DMA_HandleTypeDef s_hdma;
static uint16_t          s_dma_buf[ADC_CHANNEL_COUNT];
static ADC_Results_t     s_results;
static bool              s_running     = false;
static bool              s_data_fresh  = false;

/* ── NTC lookup: {raw_12bit, temp_x10_degc} at 3.3V, 10kΩ pullup ── */
static const int16_t NTC_LUT[10][2] = {
    { 3820, -400 },   /* -40 °C */
    { 3680, -200 },   /* -20 °C */
    { 3440,    0 },   /*   0 °C */
    { 3072,  200 },   /*  20 °C */
    { 2650,  250 },   /*  25 °C */
    { 2048,  400 },   /*  40 °C */
    { 1450,  600 },   /*  60 °C */
    {  950,  800 },   /*  80 °C */
    {  590, 1000 },   /* 100 °C */
    {  360, 1200 }    /* 120 °C */
};

/* ── Private helpers ──────────────────────────────────────────────── */
static void    prv_gpio_init(void);
static void    prv_dma_init(void);
static int16_t prv_ntc_lookup(uint16_t raw);
static void    prv_compute_engineering_units(void);

/* ── Public: Init ─────────────────────────────────────────────────── */
uint8_t ADC_Init(void)
{
    prv_gpio_init();
    prv_dma_init();

    __HAL_RCC_ADC1_CLK_ENABLE();

    s_hadc.Instance                   = ADC1;
    s_hadc.Init.Resolution            = ADC_RESOLUTION_12B;
    s_hadc.Init.ScanConvMode          = ENABLE;
    s_hadc.Init.ContinuousConvMode    = ENABLE;
    s_hadc.Init.DiscontinuousConvMode = DISABLE;
    s_hadc.Init.ExternalTrigConvEdge  = ADC_EXTERNALTRIGCONVEDGE_NONE;
    s_hadc.Init.DataAlign             = ADC_DATAALIGN_RIGHT;
    s_hadc.Init.NbrOfConversion       = ADC_CHANNEL_COUNT;
    s_hadc.Init.DMAContinuousRequests = ENABLE;
    s_hadc.Init.EOCSelection          = ADC_EOC_SEQ_CONV;

    if (HAL_ADC_Init(&s_hadc) != HAL_OK) { return ADC_ERR_NOT_INIT; }

    /* Configure each channel in scan sequence */
    ADC_ChannelConfTypeDef ch = { .SamplingTime = ADC_SAMPLETIME_480CYCLES };
    for (uint8_t i = 0; i < ADC_CHANNEL_COUNT; i++) {
        ch.Channel = i;
        ch.Rank    = i + 1U;
        HAL_ADC_ConfigChannel(&s_hadc, &ch);
    }

    return ADC_OK;
}

uint8_t ADC_Start(void)
{
    if (s_running) { return ADC_OK; }
    if (HAL_ADC_Start_DMA(&s_hadc, (uint32_t *)s_dma_buf, ADC_CHANNEL_COUNT) != HAL_OK) {
        return ADC_ERR_DMA_FAULT;
    }
    s_running = true;
    return ADC_OK;
}

uint8_t ADC_Stop(void)
{
    HAL_ADC_Stop_DMA(&s_hadc);
    s_running    = false;
    s_data_fresh = false;
    return ADC_OK;
}

const ADC_Results_t *ADC_GetResult(void)  { return &s_results; }
bool                 ADC_IsDataFresh(void) { return s_data_fresh; }

/* ── ISR: DMA complete → compute engineering units ───────────────── */
void ADC_DmaCompleteCallback(void)
{
    for (uint8_t i = 0; i < ADC_CHANNEL_COUNT; i++) {
        s_results.raw[i] = s_dma_buf[i];
    }
    prv_compute_engineering_units();
    s_data_fresh        = true;
    s_results.data_valid = true;
}

void ADC_DmaErrorCallback(void)
{
    s_data_fresh        = false;
    s_results.data_valid = false;
}

/* ── Private: Scale raw ADC to engineering units ─────────────────── */
static void prv_compute_engineering_units(void)
{
    /* Pack voltage: raw → mV at ADC pin → actual pack voltage via divider */
    uint32_t pin_mv = (s_results.raw[ADC_CH_PACK_VOLTAGE] * ADC_VREF_MV) / ADC_MAX_COUNT;
    s_results.pack_voltage_mv = pin_mv * ADC_VPACK_SCALE_NUM / ADC_VPACK_SCALE_DEN;

    /* Current: midpoint-biased, gain-corrected */
    int32_t shunt_mv = (int32_t)((s_results.raw[ADC_CH_CURRENT_SENSE] * ADC_VREF_MV)
                       / ADC_MAX_COUNT) - (int32_t)ADC_ISHUNT_OFFSET_MV;
    s_results.current_ma = (shunt_mv * 1000) / (int32_t)ADC_ISHUNT_GAIN;

    /* Temperatures via NTC lookup */
    s_results.temp_cell1_degc_x10 = prv_ntc_lookup(s_results.raw[ADC_CH_CELL_TEMP_1]);
    s_results.temp_cell2_degc_x10 = prv_ntc_lookup(s_results.raw[ADC_CH_CELL_TEMP_2]);
    s_results.temp_pcb_degc_x10   = prv_ntc_lookup(s_results.raw[ADC_CH_PCB_TEMP]);
}

/* ── Private: Linear interpolation on NTC lookup table ───────────── */
static int16_t prv_ntc_lookup(uint16_t raw)
{
    for (int i = 1; i < 10; i++) {
        if (raw >= NTC_LUT[i][0]) {
            int32_t r0 = NTC_LUT[i-1][0], r1 = NTC_LUT[i][0];
            int32_t t0 = NTC_LUT[i-1][1], t1 = NTC_LUT[i][1];
            return (int16_t)(t0 + (t1 - t0) * ((int32_t)raw - r0) / (r1 - r0));
        }
    }
    return NTC_LUT[9][1];
}

static void prv_gpio_init(void)
{
    __HAL_RCC_GPIOA_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {
        .Pin  = GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_2 | GPIO_PIN_3 | GPIO_PIN_4,
        .Mode = GPIO_MODE_ANALOG,
        .Pull = GPIO_NOPULL
    };
    HAL_GPIO_Init(GPIOA, &gpio);
}

static void prv_dma_init(void)
{
    __HAL_RCC_DMA2_CLK_ENABLE();
    s_hdma.Instance                 = DMA2_Stream0;
    s_hdma.Init.Channel             = DMA_CHANNEL_0;
    s_hdma.Init.Direction           = DMA_PERIPH_TO_MEMORY;
    s_hdma.Init.PeriphInc           = DMA_PINC_DISABLE;
    s_hdma.Init.MemInc              = DMA_MINC_ENABLE;
    s_hdma.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;
    s_hdma.Init.MemDataAlignment    = DMA_MDATAALIGN_HALFWORD;
    s_hdma.Init.Mode                = DMA_CIRCULAR;
    s_hdma.Init.Priority            = DMA_PRIORITY_HIGH;
    s_hdma.Init.FIFOMode            = DMA_FIFOMODE_DISABLE;
    HAL_DMA_Init(&s_hdma);
    __HAL_LINKDMA(&s_hadc, DMA_Handle, s_hdma);
}
