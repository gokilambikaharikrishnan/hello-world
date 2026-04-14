/**
 * @file    afe_driver.c
 * @brief   AFE IC driver over SPI — CDD layer
 *
 * Reads 14 cell voltages, pack current, and internal temperature from
 * the AFE IC via SPI1. Updates AFE_Data_t struct atomically.
 *
 * Cell voltage resolution: 1.8 mV/LSB (12-bit, inferred from register scale)
 * Current resolution: 0.3125 mA/LSB (signed 16-bit)
 *
 * NOTE: CRC check on SPI response not yet implemented — placeholder only.
 * TODO: Validate AFE_ERR_CRC path once protocol CRC byte is confirmed.
 */

#include "afe_driver.h"
#include "stm32f4xx_hal.h"
#include <string.h>

/* ── Private constants ────────────────────────────────────────────── */
#define AFE_CELL_V_SCALE_NUM   18U    /* 1.8 mV per LSB × 10 */
#define AFE_CELL_V_SCALE_DEN   10U
#define AFE_CURR_SCALE_NUM     3125U  /* 0.3125 mA per LSB × 10000 */
#define AFE_CURR_SCALE_DEN     10000U
#define AFE_SPI_DUMMY          0xFFU
#define AFE_CMD_READ           0x80U  /* Read command bit */

/* ── Private state ────────────────────────────────────────────────── */
static SPI_HandleTypeDef  s_hspi;
static AFE_Data_t         s_data;
static bool               s_initialised = false;

/* ── Private helpers ──────────────────────────────────────────────── */
static void    prv_cs_low(void);
static void    prv_cs_high(void);
static uint8_t prv_spi_read_reg(uint8_t reg, uint8_t *out);
static uint8_t prv_spi_write_reg(uint8_t reg, uint8_t val);

/* ── Public: Init ─────────────────────────────────────────────────── */
uint8_t AFE_Init(void)
{
    __HAL_RCC_SPI1_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* SPI pins: PA5=SCK, PA6=MISO, PA7=MOSI */
    GPIO_InitTypeDef gpio_spi = {
        .Pin       = GPIO_PIN_5 | GPIO_PIN_6 | GPIO_PIN_7,
        .Mode      = GPIO_MODE_AF_PP,
        .Pull      = GPIO_NOPULL,
        .Speed     = GPIO_SPEED_FREQ_HIGH,
        .Alternate = GPIO_AF5_SPI1
    };
    HAL_GPIO_Init(GPIOA, &gpio_spi);

    /* CS pin — manual control */
    GPIO_InitTypeDef gpio_cs = {
        .Pin   = AFE_CS_PIN,
        .Mode  = GPIO_MODE_OUTPUT_PP,
        .Pull  = GPIO_PULLUP,
        .Speed = GPIO_SPEED_FREQ_HIGH
    };
    HAL_GPIO_Init(AFE_CS_PORT, &gpio_cs);
    prv_cs_high();

    s_hspi.Instance               = AFE_SPI_INSTANCE;
    s_hspi.Init.Mode              = SPI_MODE_MASTER;
    s_hspi.Init.Direction         = SPI_DIRECTION_2LINES;
    s_hspi.Init.DataSize          = SPI_DATASIZE_8BIT;
    s_hspi.Init.CLKPolarity       = SPI_POLARITY_LOW;
    s_hspi.Init.CLKPhase          = SPI_PHASE_1EDGE;
    s_hspi.Init.NSS               = SPI_NSS_SOFT;
    s_hspi.Init.BaudRatePrescaler = AFE_SPI_BAUD_PRESCALER;
    s_hspi.Init.FirstBit          = SPI_FIRSTBIT_MSB;
    s_hspi.Init.CRCCalculation    = SPI_CRCCALCULATION_DISABLE;

    if (HAL_SPI_Init(&s_hspi) != HAL_OK) { return AFE_ERR_SPI; }

    /* Apply protection thresholds */
    AFE_SetProtectionThresholds(AFE_CELL_OV_THRESHOLD_MV, AFE_CELL_UV_THRESHOLD_MV);

    memset(&s_data, 0, sizeof(s_data));
    s_initialised = true;
    return AFE_OK;
}

/* ── Public: ReadAll — burst-read all cells + current + temp ─────── */
uint8_t AFE_ReadAll(void)
{
    if (!s_initialised) { return AFE_ERR_NOT_INIT; }

    uint8_t lo, hi;
    uint16_t min_mv = UINT16_MAX, max_mv = 0U;

    for (uint8_t i = 0; i < AFE_NUM_CELLS; i++) {
        uint8_t reg_l = AFE_REG_CELL_V1_L + (i * 2U);
        if (prv_spi_read_reg(reg_l,     &lo) != AFE_OK) { s_data.data_valid = false; return AFE_ERR_SPI; }
        if (prv_spi_read_reg(reg_l + 1, &hi) != AFE_OK) { s_data.data_valid = false; return AFE_ERR_SPI; }

        uint16_t raw = ((uint16_t)hi << 8U) | lo;
        uint16_t mv  = (uint16_t)(raw * AFE_CELL_V_SCALE_NUM / AFE_CELL_V_SCALE_DEN);
        s_data.cell_voltage_mv[i] = mv;
        if (mv < min_mv) { min_mv = mv; }
        if (mv > max_mv) { max_mv = mv; }
    }

    s_data.min_cell_mv  = min_mv;
    s_data.max_cell_mv  = max_mv;
    s_data.cell_delta_mv = max_mv - min_mv;

    /* Pack current (signed) */
    prv_spi_read_reg(AFE_REG_PACK_CURRENT_L, &lo);
    prv_spi_read_reg(AFE_REG_PACK_CURRENT_H, &hi);
    int16_t raw_curr = (int16_t)(((uint16_t)hi << 8U) | lo);
    s_data.pack_current_ma = (int32_t)raw_curr * (int32_t)AFE_CURR_SCALE_NUM
                             / (int32_t)AFE_CURR_SCALE_DEN;

    /* Internal temperature */
    prv_spi_read_reg(AFE_REG_INT_TEMP_L, &lo);
    prv_spi_read_reg(AFE_REG_INT_TEMP_H, &hi);
    s_data.internal_temp_degc_x10 = (int16_t)(((uint16_t)hi << 8U) | lo);

    /* Protection flags */
    prv_spi_read_reg(AFE_REG_PROT_STATUS, &s_data.prot_flags);

    s_data.data_valid = true;
    return AFE_OK;
}

const AFE_Data_t *AFE_GetData(void)     { return &s_data; }

bool AFE_IsProtectionActive(uint8_t mask) {
    return (s_data.prot_flags & mask) != 0U;
}

uint8_t AFE_SetProtectionThresholds(uint16_t ov_mv, uint16_t uv_mv)
{
    uint8_t ov_raw = (uint8_t)(ov_mv * AFE_CELL_V_SCALE_DEN / AFE_CELL_V_SCALE_NUM);
    uint8_t uv_raw = (uint8_t)(uv_mv * AFE_CELL_V_SCALE_DEN / AFE_CELL_V_SCALE_NUM);
    prv_spi_write_reg(AFE_REG_OV_THRES_L, ov_raw);
    prv_spi_write_reg(AFE_REG_UV_THRES_L, uv_raw);
    return AFE_OK;
}

void AFE_ForceBalancing(uint16_t cell_bitmask)
{
    /* NOTE: debug use only — do not call during normal operation */
    prv_spi_write_reg(AFE_REG_CTRL1, (uint8_t)(cell_bitmask & 0xFFU));
    prv_spi_write_reg(AFE_REG_CTRL2, (uint8_t)(cell_bitmask >> 8U));
}

uint8_t AFE_ReadRegister(uint8_t reg, uint8_t *value) { return prv_spi_read_reg(reg, value); }
uint8_t AFE_WriteRegister(uint8_t reg, uint8_t value)  { return prv_spi_write_reg(reg, value); }

/* ── Private SPI helpers ──────────────────────────────────────────── */
static void prv_cs_low(void)  { HAL_GPIO_WritePin(AFE_CS_PORT, AFE_CS_PIN, GPIO_PIN_RESET); }
static void prv_cs_high(void) { HAL_GPIO_WritePin(AFE_CS_PORT, AFE_CS_PIN, GPIO_PIN_SET);   }

static uint8_t prv_spi_read_reg(uint8_t reg, uint8_t *out)
{
    uint8_t tx[2] = { AFE_CMD_READ | reg, AFE_SPI_DUMMY };
    uint8_t rx[2] = { 0U };
    prv_cs_low();
    HAL_StatusTypeDef st = HAL_SPI_TransmitReceive(&s_hspi, tx, rx, 2U, AFE_COMM_TIMEOUT_MS);
    prv_cs_high();
    if (st != HAL_OK) { return AFE_ERR_SPI; }
    *out = rx[1];
    return AFE_OK;
}

static uint8_t prv_spi_write_reg(uint8_t reg, uint8_t val)
{
    uint8_t tx[2] = { reg & ~AFE_CMD_READ, val };
    prv_cs_low();
    HAL_StatusTypeDef st = HAL_SPI_Transmit(&s_hspi, tx, 2U, AFE_COMM_TIMEOUT_MS);
    prv_cs_high();
    return (st == HAL_OK) ? AFE_OK : AFE_ERR_SPI;
}
