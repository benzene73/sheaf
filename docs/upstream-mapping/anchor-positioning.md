# Arrowless anchor-positioning extraction

Pin: Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
Source: `packages/react/src/internals/useAnchorPositioning.ts`.
Dependency: `@floating-ui/dom` **1.8.0**, matching the pinned upstream fixture's
resolved `@floating-ui/react-dom` dependency. Geometry algorithms remain upstream
Floating UI; this translates Base UI's assembly/policy, not Floating UI itself.
MIT notice: `licenses/BASE-UI-MIT.txt`.

## Exact branches translated

- Logical/physical side and offset callback metadata, lines 35–62 and 185–202.
- Padding normalization and preferred-side bias, lines 204–237.
- Numeric/function side and align offsets, lines 251–275.
- Flip/shift flags, arrowless limiter and middleware ordering, lines 278–364.
- Available width AND height CSS variables and DPR-snapped anchor dimensions,
  size.apply lines 368–392. Bias is applied only to flip padding; shift and size
  preserve requested collision padding.
- Auto-update flags, lines 461–467. ResizeObserver/IntersectionObserver guards
  remain; disabling tracking does not disable ancestor resize, matching upstream.
- Initial fixed/top0/left0/opacity0 and 100vw/100vh CSS-variable seed policy,
  lines 494–536.

`createAnchorPositioningOptions(params)` returns Floating UI computePosition
options. `startAnchorPositioning(anchor, floating, params)` supplies explicit
mount/update/destroy instead of React effects. It writes position, transform,
data-side, data-align and data-positioned after the current compute resolves.
Stop it when popup closes or hook is destroyed. Recreate it when configuration
changes. The caller must show/mount the floating element before starting.

Consumer CSS must use `max-width: var(--available-width)` and
`max-height: var(--available-height)` on the popup and provide overflow behavior.
Setting variables without consuming them does not constrain the panel. Native
popover additionally needs UA margin/inset/padding/border reset in the host; this
is a host integration concern, not upstream middleware behavior.

## Browser oracle

`popover/positioner/PopoverPositioner.test.tsx:318`:
`rests exactly at collisionPadding from the colliding edge`.
Anchor fixed bottom8/left16, tall1000px popup max-height available-height,
sideOffset8/collisionPadding12/fallbackAxisSide none. Expected rendered side top,
top coordinate rounded exactly12. This catches accidentally applying preferred
side bias to size/shift. Other tests near :62–201 map offset callbacks/logicalRTL.

Shared fixture also checks width overflow at mobile viewport, normal flip/gap,
and resizing an open popup. Their actual result artifacts establish parity;
the six direct middleware tests are configuration/effect evidence only.

## Explicit omissions and differences

No arrow middleware (including upstream fake-arrow transform-origin machinery),
transform-origin CSS, adaptive origin, hidden-anchor handling, lazy-flip mount
side retention, inline virtual-anchor middleware, nested floating tree or React
ref registration. No complete Popover dismissal/focus/modal behavior is ported
by this unit. Native popover top-layer behavior is a substitution requiring its
own composition tests; coordinate tests alone do not certify it.

The DOM lifecycle uses a mounted flag and latest-update token to reject late
coordinate writes. This is LiveView adapter ownership, not a literal translation
of React hook scheduling. Size.apply uses mounted guard; configuration must not
mutate in place during an active lifecycle.

Visual viewport geometry is delegated to the same Floating UI DOM dependency.
The private shift.rootBoundary override is retained; no claim of software-
keyboard or pinch-zoom validation follows from desktop viewport resizing.
