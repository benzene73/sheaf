# List navigation boundaries

The extracted algorithm is vertical, virtual-focus and non-grid. It does not
claim horizontal/RTL/nested menu parity. Home/End remain editing keys for an
editable combobox, matching the upstream branch. For a non-typeable consumer,
the helper exposes upstream Home/End endpoint behavior, but no menu fixture has
been certified by this initial unit.

The upstream visibility fallback when `checkVisibility` is unavailable only
checks display and visibility. It does not detect every hidden ancestor or
content-visibility case. Preserved deliberately for source fidelity; do not
describe it as stronger visibility support than upstream.

React scheduling, mounted-list retries and virtualizer flags are outside this
pure extraction. LiveView adapters must wait for visible rendered options,
reconcile removed active IDs and guard stale async work separately. Passing
algorithm tests cannot establish that adapter contract.
