# Public Combobox positioning and accepted-label reconciliation

Chromium-only bounded verification after integrating the existing shared positioner:

- `node harness/combobox-positioning.mjs` passes against actual /label-combobox. At a 375x500 viewport, an intentionally 400px-wide anchor near the bottom and a 1000px-tall list produce a fixed popup at x=8,y=8,width=359,height=439. The shared middleware constrains it to viewport insets; input retains focus and Escape closes the native popup. Artifact: artifacts/combobox-positioning.json.
- A focused actual-hook browser probe verifies closed accepted-value replacement updates the displayed label (United Kingdom to India), while an open United query survives replacement of the canonical accepted value. Artifact: artifacts/combobox-canonical-reset.json. This latter probe invokes updated() directly, not a full server patch transport.

The helper opts into native manual popover. Legacy inline fixtures remain inline. No new geometry engine, backdrop, scroll lease, server protocol or dismissal policy was introduced. Positioner cleanup guards asynchronous updates after close/destroy. Existing shared labels cases are rerun separately because the helper rendering changed.
