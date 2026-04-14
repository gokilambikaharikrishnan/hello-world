export const LAYER_MAP: Record<string, string> = {
    // MCAL - Microcontroller Abstraction Layer (BSW)
    'ADC': 'MCAL', 'CAN': 'MCAL', 'GPIO': 'MCAL',
    'SPI': 'MCAL', 'PWM': 'MCAL', 'TIMER': 'MCAL', 'UART': 'MCAL',
    // CDD - Complex Device Drivers (BSW)
    'AFE': 'CDD', 'EWDG': 'CDD',
    'RelayDriver': 'CDD', 'SerialFlash': 'CDD',
    // ESAL - ECU Software Abstraction Layer (BSW)
    'BATT_IF': 'ESAL', 'CONTACTOR_IF': 'ESAL',
    'HEATER_IF': 'ESAL', 'RTC_IF': 'ESAL',
    'SAFETY_IF': 'ESAL', 'UART_IF': 'ESAL',
    'HEARTBEAT_IF': 'ESAL', 'DCDCHWSIGNAL_IF': 'ESAL',
    // SRVLayer - Service Layer (BSW)
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

/** Which top-level group each layer belongs to */
export const LAYER_GROUP: Record<string, 'BSW' | 'ASW'> = {
    'MCAL':     'BSW',
    'CDD':      'BSW',
    'ESAL':     'BSW',
    'SRVLayer': 'BSW',
    'ASW':      'ASW'
};

export const LAYER_META: Record<string, {
    fullName: string;
    description: string;
    color: string;
    icon: string;
    group: 'BSW' | 'ASW';
}> = {
    'MCAL': {
        fullName: 'Microcontroller Abstraction Layer',
        description: 'Bare metal STM32 peripheral drivers',
        color: '#7c3aed',
        icon: '🔧',
        group: 'BSW'
    },
    'CDD': {
        fullName: 'Complex Device Drivers',
        description: 'External IC and chip-level drivers',
        color: '#b45309',
        icon: '⚙️',
        group: 'BSW'
    },
    'ESAL': {
        fullName: 'ECU Software Abstraction Layer',
        description: 'Interface contracts between layers',
        color: '#0891b2',
        icon: '🔌',
        group: 'BSW'
    },
    'SRVLayer': {
        fullName: 'Service Layer',
        description: 'Cross-cutting services: NVM, Scheduler, Events',
        color: '#059669',
        icon: '🛠',
        group: 'BSW'
    },
    'ASW': {
        fullName: 'Application Software',
        description: 'BMS application logic and algorithms',
        color: '#1f6feb',
        icon: '🧠',
        group: 'ASW'
    }
};
