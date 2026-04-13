export const LAYER_MAP: Record<string, string> = {
    // MCAL - Microcontroller Abstraction Layer
    'ADC': 'MCAL', 'CAN': 'MCAL', 'GPIO': 'MCAL',
    'SPI': 'MCAL', 'PWM': 'MCAL', 'TIMER': 'MCAL', 'UART': 'MCAL',
    // CDD - Complex Device Drivers
    'AFE': 'CDD', 'EWDG': 'CDD',
    'RelayDriver': 'CDD', 'SerialFlash': 'CDD',
    // ESAL - Interface Layer
    'BATT_IF': 'ESAL', 'CONTACTOR_IF': 'ESAL',
    'HEATER_IF': 'ESAL', 'RTC_IF': 'ESAL',
    'SAFETY_IF': 'ESAL', 'UART_IF': 'ESAL',
    'HEARTBEAT_IF': 'ESAL', 'DCDCHWSIGNAL_IF': 'ESAL',
    // SRVLayer - Service Layer
    'Battery_Diagnostics': 'SRVLayer',
    'BMS_PWR_MNGT_SRVC': 'SRVLayer',
    'BootManagerSw': 'SRVLayer', 'CAN_NM': 'SRVLayer',
    'Event_Manager': 'SRVLayer', 'NVM': 'SRVLayer',
    'RTCAppl': 'SRVLayer', 'Scheduler': 'SRVLayer',
    'SWTimer': 'SRVLayer',
    // ASW - Application Software
    'CodeExecution': 'ASW', 'ContactorControl': 'ASW',
    'CriticalFaultControl': 'ASW', 'DcDcHwSignal': 'ASW',
    'DynamicPwrLimitsComp': 'ASW', 'Heartbeat': 'ASW',
    'HeaterControl': 'ASW', 'PowerComputation': 'ASW',
    'PyroControl': 'ASW', 'Safety_Appl': 'ASW',
    'Segger': 'ASW', 'StackMon': 'ASW', 'Tester': 'ASW'
};

export const LAYER_ORDER = [
    'MCAL', 'CDD', 'ESAL', 'SRVLayer', 'ASW'
];

export const LAYER_META: Record<string, {
    fullName: string;
    description: string;
    color: string;
    icon: string;
}> = {
    'MCAL': {
        fullName: 'Microcontroller Abstraction Layer',
        description: 'Bare metal STM32 peripheral drivers',
        color: '#7c3aed',
        icon: '🔧'
    },
    'CDD': {
        fullName: 'Complex Device Drivers',
        description: 'External IC and chip-level drivers',
        color: '#b45309',
        icon: '⚙️'
    },
    'ESAL': {
        fullName: 'ECU Software Abstraction Layer',
        description: 'Interface contracts between layers',
        color: '#0891b2',
        icon: '🔌'
    },
    'SRVLayer': {
        fullName: 'Service Layer',
        description: 'Cross-cutting services: NVM, Scheduler, Events',
        color: '#059669',
        icon: '🛠'
    },
    'ASW': {
        fullName: 'Application Software',
        description: 'BMS application logic and algorithms',
        color: '#1f6feb',
        icon: '🧠'
    }
};
