# Architecture and ownership

Browser controllers own transient focus, open state, highlighted items and pointer
state. Combobox selection uses the documented mount/intent/request protocol;
LiveView owns its accepted value and option contents. Select provides immediate
feedback then reconciles the host's accepted assign. The small Controls helpers
(number field, tabs, accordion and toggle group) are explicitly browser-owned:
their `default_value` is mount-time configuration, with server notifications.
These are different public contracts, not an implicit universal controlled API.

The event/ownership contracts are documented in docs/components.md and
docs/behavioral-contracts. No helper promises asynchronous approval unless its
host protocol actually implements it. Stable root IDs isolate instances; stable
required parts remain under LiveView ownership. Hooks restore transient attributes
after patches and clean up listeners/timers/positioning on destruction.

Use TypeScript for reusable client behavior, thin LiveView hook adapters and HEEx
parts. Reuse Floating UI DOM algorithms for positioning. Native dialog/popover
substitutions require mapped behavior tests and documented upstream differences.
Use supported LiveView portal where needed; do not manually reparent server-owned
nodes without a designed lifecycle contract.

## First gate
One actual bounded upstream translation and shared executable scenario running
against Base UI React and LiveView, plus a deliberately broken variant failing.
Do not expand component inventory before this gate is independently reviewed.

## Evidence
Keep mapping under docs/upstream-mapping, contracts under docs/behavioral-contracts,
intentional differences under docs/known-divergences and run reports under docs/runs.
Tests measure focus, active item, accepted value, open state and semantic events;
do not compare React and LiveView DOM byte-for-byte. Current verification target
is Chromium, per the user's instruction. Earlier Firefox/WebKit results remain
historical evidence, not a promise that newer components were tested there.
Physical mobile and screen-reader checks remain distinct from browser snapshots.

## Practical stopping rule

Prove ordinary keyboard/pointer use, accessible relationships, dismissal and the
relevant LiveView patch behavior. Fix concrete failures and move to the next useful
component. Do not expand a passing family into an exhaustive edge-case matrix.
Record omissions so consumers can distinguish a bounded usable slice from full
Base UI compatibility. A final regression pass checks integrated changes once.
