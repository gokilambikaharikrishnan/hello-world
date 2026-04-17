export const SRVLAYER_FOCUS = `\
LAYER: SRVLayer — Service Layer

You are documenting a service module that provides
infrastructure capabilities to the application software.

What to focus on in every section:

Section 1 (Overview):
Start by explaining what service this provides and what
would fail in the BMS application if this service was
unavailable. Be specific: which ASW module fails first
and what is the consequence for the battery system?
Example for NVM: "BatteryEstimation would have no stored
SOC on startup. It would initialise to 50% default,
causing incorrect charge/discharge decisions until the
OCV-based SOC re-convergence completes — taking
potentially hours of operation."

Section 3 (Config):
SRVLayer modules often have important sizing parameters:
buffer sizes, timeout values, retry counts, NVM addresses.
These have safety implications. Document them carefully.

Section 4 (Functions):
Group clearly by: init, cyclic (called by Scheduler),
and API functions (called by ASW modules on demand).
For cyclic functions: state the period and why that
period was chosen.
For API functions: state the worst-case execution time
if determinism matters.

Section 7 (Sequence):
Show how the Scheduler calls this service cyclically
AND how an ASW module calls it on demand.
Two sequences in one diagram shows the dual nature
of service layer modules.

Section 8 (State machine):
SRVLayer modules often have important operational states:
uninitialised, ready, busy, error, degraded.
A module in degraded state might return cached data
instead of live data — this has safety implications.
Document degraded mode behaviour explicitly.
`
