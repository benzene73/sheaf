# Positioning paired gate

Exact Base UI source pin `4d92faa1a4da6a5fe66a6194401470974fc2f8fe` and
Floating UI DOM 1.8.0. Both the React reference and LiveView native-popover adapter
passed five geometry scenarios on Chromium 145, Firefox 146 and WebKit 26:
**30/30 target executions**.

Fixtures use identical fixed anchor coordinates (bottom 8, left 16, width 100,
height 40), 8px side offset, 12px collision inset, bottom/center preference and no
fallback-axis side. Content consumes the available-width/height CSS variables.

Coverage:

- 200×1000 popup flips and rests at exactly 12px top inset, without bias leakage.
- Tall popup fits a 320×450 viewport.
- 1000px-wide popup is constrained to the narrow viewport.
- Normal popup maintains an 8px gap after flipping above the anchor.
- Resizing an open popup from desktop to narrow viewport recomputes placement.

Every target must satisfy bounds, side and gap constraints. Pair x/y/width/height
are also compared with 0.75px tolerance; this is below the 1px upstream bias bug
that the first scenario is intended to catch. Mouse actions remain real clicks.
The shared anchor test ID avoids an irrelevant sample label difference (`Open`
versus `Open popup`). It does not bypass hit testing.

The first harness attempt timed out because a fixed-children-only main element
has zero height; readiness now waits for the explicit mounted attribute to be
attached, independently from layout. An initial label locator mismatch was also
corrected. These were fixture discovery failures, not successful geometry runs.

Reproduce with `BROWSERS=chromium,firefox,webkit node harness/positioning.mjs`.
Raw run output: `artifacts/positioning-paired-label-independent.json`.

This does not prove complete popover parity: arrow positioning, clipping ancestors,
transformed containers, scroll recovery, focus/dismissal nesting, visual viewport
keyboard behavior and physical mobile remain separate concerns. The native top
layer host is an explicit platform substitution; these tests concern the mapped
positioning algorithm and its narrow adapter only.
