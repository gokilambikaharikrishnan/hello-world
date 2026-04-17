export const ESAL_FOCUS = `\
LAYER: ESAL — ECU Software Abstraction Layer

You are documenting an interface module that creates an
abstraction boundary between drivers and application code.

What to focus on in every section:

Section 1 (Overview):
Start by explaining what abstraction means in embedded
firmware and why it matters for maintainability.
Core message: if the AFE chip is replaced in hardware rev 2,
only the CDD changes. The ESAL interface stays the same.
ASW never knows the chip changed.
Explain specifically what complexity this interface hides
from the layers above it.

Section 2 (Hardware):
ESAL modules do not touch hardware directly.
State clearly: "This module does not access hardware."
Then explain which CDD or MCAL module provides the
hardware access that this interface abstracts.

Section 3 (Config):
ESAL modules often have minimal config.
If they do have config: explain what it controls and
why it is configurable at this layer vs in the CDD below.

Section 4 (Functions):
This is the most important section for ESAL.
The function signatures ARE the API contract.
For each function: explain the contract precisely.
What does the caller guarantee to pass in?
What does this function guarantee to return?
What invariants must hold?
A new engineer should be able to use this API correctly
after reading this section alone, without looking at the
CDD code below.

Section 6 (Dependencies):
Show clearly: what CDD functions this IF calls downward,
and what SRVLayer or ASW functions call upward into this IF.
This cross-layer view is why ESAL documentation exists.

Section 7 (Sequence):
Show a complete call chain: ASW calls ESAL, ESAL calls CDD,
CDD calls MCAL, data returns back up the chain.
This is the most valuable diagram for understanding the
abstraction layers.
`
