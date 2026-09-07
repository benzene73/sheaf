# Base UI behavioral port

Deadline: September 7, 2026 20:30 UTC / September 8 02:00 IST.
Source: Base UI commit `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

Read ARCHITECTURE.md for ownership and gate requirements. The historical
source-informed trial is preserved in docs/history/ten-minute-trial.md and at `/`.
It is not a Base UI port. The source-translated fixture is at `/paired`.

First translation: floating-ui-react list-navigation vertical/virtual branch,
visibility and disabled-item scan, and opening index selection. Exact functions,
upstream tests, omissions and divergences are in docs/upstream-mapping and
 docs/known-divergences. The LiveView adapter is integration scaffolding; it is
not yet a translation of the full ComboboxRoot state machine.

Gate: shared observable scenarios must execute actual pinned React source and
LiveView. A deliberately changed navigation rule must fail those scenarios.
Independent source and test review is required before expanding families.
Record browser runs, failures and unverified behavior explicitly. Passing the
bounded gate is not full combobox parity or production-readiness.
