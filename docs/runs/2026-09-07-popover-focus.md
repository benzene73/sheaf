# Popover focus gate

Before wiring the mapped focus controller, the paired Chromium run passed 6/12
target executions: all six Base UI reference cases passed; all six LiveView cases
stopped at the same initial-focus precondition. The popup opened, but focus stayed
on the anchor instead of moving to the first Inside button.

This proves **one initial-focus gap**, not six independent interaction bugs.
Tab, action, Escape and outside-dismissal steps had not yet executed in those
failed target cases. Geometry passing alone had not covered focus behavior.
Raw baseline: `artifacts/popover-behavior-before-focus.json`.

The reference fixture has a first Inside button and a Last button, explicit
modal/nonmodal configuration, an inside-action count and an outside-click count.
The shared tests use actual keyboard and pointer interactions. Current scope is
initial keyboard focus, Tab between controls, Escape restoration, inside action
remaining open, and modal/nonmodal outside activation policy. This is not a
complete focus manager, nested-layer or screen-reader conformance claim.

After integrating the source-derived focus controller, Chromium passed **12/12**
paired behavior executions. Geometry remained **10/10**. User steering changed
the remaining run scope to Chromium only; these new fixes have no updated
Firefox/WebKit verification. Raw reports: `artifacts/popover-focus-chromium.json`
and `artifacts/positioning-focus-chromium.json`.

Four LiveView-specific lifecycle cases also passed on Chromium: a patch during
composition preserves visible composition text and deferred filtering; removing
or replacing the highlighted row clears the dangling active descendant; unmount
and remount isolate old pending proposal ownership from the new instance.
Raw report: `artifacts/liveview-lifecycle-chromium.json`. These are LiveView
adapter tests, not additional upstream parity cases.
