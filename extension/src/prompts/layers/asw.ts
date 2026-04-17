export const ASW_FOCUS = `\
LAYER: ASW — Application Software

You are documenting a BMS application module that
implements battery management logic and decisions.

What to focus on in every section:

Section 1 (Overview):
Start by explaining the physical scenario this module
protects against or enables.
For ContactorControl: explain what a contactor is,
what happens if you close it onto a shorted load
(inrush current that can weld the contacts permanently),
what happens if it opens under full load
(voltage spike that can damage electronics).
The code decisions — the delays, the pre-charge sequence,
the feedback checks — all make sense once the physics
is clear.
For protection modules: explain what happens to LFP cells
when the protection threshold is exceeded.
Overdischarge causes irreversible copper dissolution.
Overcharge causes electrolyte decomposition and gas.

Section 4 (Functions):
For decision functions: document every condition that
triggers a state change or output change.
Show the decision logic as a truth table if it has
multiple input conditions.
Format: | Condition1 | Condition2 | Output |

Section 7 (Sequence):
Show the complete decision and action sequence.
What data comes in, what is evaluated, what command
goes out, what confirmation is expected.
For protection modules: show normal operation AND
the fault response sequence.

Section 8 (State machine):
ASW modules almost always have state machines.
This is the most important section for ASW.
For each state: what physical condition does the
battery system need to be in for this state to be valid?
For each transition: what sensor reading, timeout, or
external command triggers it?
For fault states: is the transition reversible?
What is the recovery path?

Section 9 (Design decisions):
Focus on safety-critical decisions.
Why is the threshold set at this value and not 5% higher?
Why is the delay 500ms and not 100ms?
Why is this fault latching (requires reset) vs
self-recovering?
These are the decisions a new engineer must not change
without understanding the safety analysis behind them.
`
