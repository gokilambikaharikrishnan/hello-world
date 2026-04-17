export const CDD_FOCUS = `\
LAYER: CDD — Complex Device Drivers

You are documenting a driver for an external IC or hardware
component. This layer sits above MCAL (raw peripheral) and
below ESAL (abstraction interface).

What to focus on in every section:

Section 1 (Overview):
Start by explaining what the external IC does physically.
What does it measure or control in the real world?
Why does the BMS need this specific piece of hardware?
What would happen to battery safety if this IC failed
or if this driver had a bug?

Section 2 (Hardware):
Describe the physical interface: which MCAL peripheral
is used (SPI1, CAN1, I2C1 etc), pin connections,
communication voltage levels, chip select handling.
Document the IC's communication protocol: frame format,
command bytes, response format, CRC if used.

Section 3 (Config):
For SPI/I2C devices: document clock speed, mode (CPOL/CPHA),
word size, CS polarity.
For CAN-based devices: document message IDs, DLC, period.
Explain why these specific values were chosen.

Section 4 (Functions):
Pay special attention to the initialisation sequence —
external ICs often have a specific power-on sequence with
timing requirements. Document every step and the timing.
For read functions: show how raw IC data is converted to
engineering units (raw ADC count to millivolts etc).

Section 7 (Sequence):
Show the full IC communication sequence: CS assert, SPI/I2C
transfer, CS deassert, response parsing, error check.
Use actual byte values if visible in code.

Section 8 (State machine):
CDD modules often have: uninitialised, initialising,
ready, communicating, fault states.
Document what causes fault state and how recovery works.
`
