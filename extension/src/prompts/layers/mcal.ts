export const MCAL_FOCUS = `\
LAYER: MCAL — Microcontroller Abstraction Layer

You are documenting a bare metal STM32H743ZI peripheral driver.
This is the lowest software layer — it talks directly to hardware.

What to focus on in every section:

Section 1 (Overview):
Start by explaining what this STM32 peripheral IS from first
principles. What physical problem does it solve at the silicon
level? Why do microcontrollers need this peripheral?
Then explain why a BMS specifically needs it.
A CAN peripheral exists because BMS systems operate in
high-noise environments where UART would corrupt messages.
An ADC exists because the MCU needs to read analog voltages
from NTC temperature sensors.

Section 2 (Hardware):
This is the most important section for MCAL.
List every register touched: name, address offset, value
written, and what that value configures in plain English.
Include: clock enable register, mode registers, interrupt
enable registers, DMA config registers if used.
Do not skip registers. New engineers break things by not
knowing which registers interact.

Section 3 (Config):
Pull every #define for: clock dividers, baud rates,
buffer sizes, interrupt priorities, timeout values.
Explain the calculation behind timing values.
Example: "USART_BRR = 0x008B. At 80MHz APB1,
BRR=139 gives 115200 baud. Formula: BRR = fCLK / baudrate."

Section 4 (Functions):
For ISR handlers: explain exactly what triggers the interrupt,
what the handler does, what flag it clears, and what
would happen if the flag was not cleared.
For init functions: list every register written in order.
The sequence matters — some registers must be set before others.

Section 7 (Sequence):
Show the init sequence as a sequenceDiagram.
Include: clock enable, peripheral config, interrupt enable,
DMA setup if present, ready flag check.
Label each step with the actual register or function name.

Section 8 (State machine):
Most MCAL modules do not have explicit state machines but
do have implicit states: uninitialised, initialised, busy,
ready, error. Document these even if they are not in an enum.
`
