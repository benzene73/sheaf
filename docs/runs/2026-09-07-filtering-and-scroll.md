# Filtering, form values and menu scroll

Both targets use the same previously recorded Base UI source pin.

Filtering/form scenarios passed **30/30** target executions across Chromium,
Firefox and WebKit: locale-sensitive contains filtering (AFE matches Café), no
results, exact selected-label filtering after an edit, selected-value bypass on
a fresh open, and native form submission of accepted values rather than queries.
The reopen scenario waits for close completion (options gone and highlight
cleared), because merely observing aria-expanded false was insufficient to
establish the intended fresh-open precondition in the upstream fixture.

Menu scroll scenarios passed **12/12** across the same engines. The identical
document wrapper is made scrollable; real wheel events are delivered outside the
menu. Default modality prevents scrolling. Nonmodal mode allows it. Closing
restores original inline overflow styles and permits scrolling again. The wheel
check waits for actual event delivery and subsequent animation frames; it does
not replace wheel behavior with a synthetic scroll call. Nonmodal and restored
scroll checks provide positive controls for the same wheel stimulus.

Reproduce `harness/filtering.mjs` and `harness/menu-scroll.mjs` with
`BROWSERS=chromium,firefox,webkit`. Raw reports:
`artifacts/filtering-paired.json` and `artifacts/menu-scroll-paired.json`.

These are bounded fixtures. They do not certify arbitrary Unicode normalization,
all locale policies, scroll locking with multiple nested layers, touch scrolling,
mobile keyboards, or app-level form recovery.
