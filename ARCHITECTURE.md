# Initial architecture — reviewed changes permitted

Browser controller owns transient focus, open state, highlighted item, pointer
state and immediate invalidation. LiveView owns accepted values, validation and
server-rendered option contents. Query generations and acknowledgements form the
boundary protocol. Rejection must not overwrite a newer accepted value.

The first public contract must explicitly define controlled/uncontrolled use,
selection proposal/acceptance and loading. Prototype's synchronous rejection is
not the final contract. Document any change before multiple components consume it.

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
do not compare React and LiveView DOM byte-for-byte. Browser matrix is Chromium,
Firefox and WebKit; support claims require actual passing runs. Physical mobile
and screen-reader checks remain distinct from browser accessibility snapshots.
