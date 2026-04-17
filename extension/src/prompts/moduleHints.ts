export const MODULE_HINTS: Record<string, string> = {

    // ── MCAL (17 modules) ─────────────────────────────────────────────────────
    // Ask your Copilot: "Give me a 3-4 line technical context hint for the
    // [MODULE] MCAL driver in our STM32H743ZI BMS firmware covering: which
    // peripheral, key registers, interrupts, DMA, and BMS role."

    'ADC':         'INSERT_HINT_HERE',
    'CAN':         'INSERT_HINT_HERE',
    'CLOCK':       'INSERT_HINT_HERE',
    'DMA':         'INSERT_HINT_HERE',
    'FLASH':       'INSERT_HINT_HERE',
    'GPIO':        'INSERT_HINT_HERE',
    'I2C':         'INSERT_HINT_HERE',
    'IRQM':        'INSERT_HINT_HERE',
    'IWDG':        'INSERT_HINT_HERE',
    'MCU':         'INSERT_HINT_HERE',
    'PWM':         'INSERT_HINT_HERE',
    'RTC':         'INSERT_HINT_HERE',
    'Safety':      'INSERT_HINT_HERE',
    'SPI':         'INSERT_HINT_HERE',
    'STM32H743ZI': 'INSERT_HINT_HERE',
    'Timer':       'INSERT_HINT_HERE',
    'UART':        'INSERT_HINT_HERE',

    // ── CDD (4 modules) ───────────────────────────────────────────────────────
    // Ask your Copilot: "Give me a 3-4 line technical context hint for the
    // [MODULE] CDD driver in our BMS covering: what IC it drives, protocol
    // used, key functions, and safety importance."

    'AFE':          'INSERT_HINT_HERE',
    'EWDG':         'INSERT_HINT_HERE',
    'RelayDriver':  'INSERT_HINT_HERE',
    'Serial_Flash': 'INSERT_HINT_HERE',

    // ── ESAL (12 modules) ─────────────────────────────────────────────────────
    // Ask your Copilot: "Give me a 3-4 line technical context hint for the
    // [MODULE] ESAL interface in our BMS covering: what it abstracts, what
    // lower layer it wraps, what upper layer consumes it."

    'BATT_IF':         'INSERT_HINT_HERE',
    'BKPSR_IF':        'INSERT_HINT_HERE',
    'CANIF':           'INSERT_HINT_HERE',
    'CONTACTOR_IF':    'INSERT_HINT_HERE',
    'DCDCHWSIGNAL_IF': 'INSERT_HINT_HERE',
    'ECU_IF':          'INSERT_HINT_HERE',
    'HEARTBEAT_IF':    'INSERT_HINT_HERE',
    'HEATER_IF':       'INSERT_HINT_HERE',
    'MEM_IF':          'INSERT_HINT_HERE',
    'RTC_IF':          'INSERT_HINT_HERE',
    'SAFETY_IF':       'INSERT_HINT_HERE',
    'UART_IF':         'INSERT_HINT_HERE',

    // ── SRVLayer (9 modules) ──────────────────────────────────────────────────
    // Ask your Copilot: "Give me a 3-4 line technical context hint for the
    // [MODULE] service in our BMS covering: what service it provides, which
    // ASW modules use it, how triggered, data persisted."

    'Battery_Diagnostics': 'INSERT_HINT_HERE',
    'BMS_PWR_MNGT_SRVC':   'INSERT_HINT_HERE',
    'BootManagerSw':        'INSERT_HINT_HERE',
    'CAN_NM':               'INSERT_HINT_HERE',
    'Event_Manager':        'INSERT_HINT_HERE',
    'NVM':                  'INSERT_HINT_HERE',
    'RTCAppl':              'INSERT_HINT_HERE',
    'Scheduler':            'INSERT_HINT_HERE',
    'SWTimer':              'INSERT_HINT_HERE',

    // ── ASW (19 modules) ──────────────────────────────────────────────────────
    // Ask your Copilot: "Give me a 3-4 line technical context hint for the
    // [MODULE] ASW module in our 14S LFP BMS covering: what BMS feature it
    // implements, inputs it reads, decisions it makes, safety impact."

    'App_Stubs':             'INSERT_HINT_HERE',
    'BatProtection':         'INSERT_HINT_HERE',
    'BatteryEstimation':     'INSERT_HINT_HERE',
    'BattFaultModule':       'INSERT_HINT_HERE',
    'BattStateMachine':      'INSERT_HINT_HERE',
    'CANAppl':               'INSERT_HINT_HERE',
    'CodeExecution':         'INSERT_HINT_HERE',
    'ContactorControl':      'INSERT_HINT_HERE',
    'CriticalFaultControl':  'INSERT_HINT_HERE',
    'DcDcHwSignal':          'INSERT_HINT_HERE',
    'DynamicPwrlLimitsComp': 'INSERT_HINT_HERE',
    'Heartbeat':             'INSERT_HINT_HERE',
    'HeaterControl':         'INSERT_HINT_HERE',
    'PowerComputation':      'INSERT_HINT_HERE',
    'PyroControl':           'INSERT_HINT_HERE',
    'Safety_Appl':           'INSERT_HINT_HERE',
    'Segger':                'INSERT_HINT_HERE',
    'StackMon':              'INSERT_HINT_HERE',
    'Tester':                'INSERT_HINT_HERE',

}
