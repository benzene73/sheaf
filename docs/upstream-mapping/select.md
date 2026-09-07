# Bounded single Select consumer policy

Pin Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
MIT notice: `licenses/BASE-UI-MIT.txt`.

`src/behavior/select.ts` extracts SelectRoot.tsx setValue (:314–323),
useTypeahead options/onMatch (:372–392), SelectItem.tsx single commit (:126–145)
and item keydown (:156–163), plus utils/isElementDisabled.ts.
getSelectOpeningIndex maps useListNavigation's selectedIndex opening sync
(:371–377) followed by the already-extracted directional initial branch.

## Source-specific differences from Combobox/Menu

- SelectRoot defaults modal=true. SelectPositioner defaults
  **alignItemWithTrigger=true**, involving dedicated measurement/scroll-arrow
  geometry not ported here. Any fixture using the shared arrowless positioner
  must explicitly set alignItemWithTrigger=false in BOTH implementations and
  report that scope; it is not default Select positioning parity.
- Arrow navigation is non-virtual DOM focus and does not loop by default
  (SelectRoot omits loopFocus, useListNavigation defaultfalse). Pass typeable=false,
  loopFocus=false, disabledIndices=[] to extracted navigateList. aria-disabled
  options can be focused by arrows but cannot be activated.
- Typeahead uses generic750ms reset, not Menu500ms. It passes an attribute-only
  disabled predicate and deliberately does NOT supply elementsRef: closed
  force-mounted options are hidden but still searchable. Missing elements and
  aria-disabled options are excluded, unlike Menu typeahead.
- Open typeahead highlights; closed typeahead requests value with reason none
  without opening. readOnly disables closed committing but permits open browsing.
- Selected index takes precedence over directional endpoint when opening by
  keyboard. Pointer opening/force-mounted registration is not implemented here.
- **Canceled item value does not cancel close.** SelectItem creates separate
  details for setValue and setOpen, unlike Combobox's shared-details early-return
  behavior. The port preserves this difference rather than standardizing it.

## Integration

requestSelectValue invokes onValueChange, then checks cancellation before assign.
runSelectItemSelection rejects disabled/readOnly then invokes requestValue and
requestOpen with separate details. The caller must establish legitimate activation
first; full mouse-down/drag/virtual-click eligibility from SelectItem is omitted.
runSelectItemKey records active index and prevents Space activation during typing;
useButton keyboard activation is composed separately.

createSelectTypeahead wraps the source-extracted engine with actual SelectRoot
options. State includes labels/elements/values, activeIndex, selectedIndex, open,
disabled/readOnly. Keep these collections aligned and invoke sync when open or
selectedIndex changes; destroy when removed. Server-backed acceptance remains
an explicit adapter concern, not a new synchronous upstream guarantee.

## Tests

Upstream SelectRoot.test.tsx typeahead suite :5065; disabled closed match :5109,
closed provided items :5143, disabled-only match :5179, open disabled skipping
:5249; readOnly closed :2986 and open :3014. Ten local tests verify value/close
ordering, disabled/readOnly guards, selected opening, typeahead timeout/modes,
hidden force-mounted items and missing-element exclusion.

No claims for multiple selection, default item-aligned positioning, scroll
arrows, drag selection, touch virtualization, autofill or full form validation.
Browser paired Select scenarios and independent review remain separate gates.

## Select cancellation negative control

Replace the two fresh createChangeEventDetails calls in runSelectItemSelection
with one shared details object. The local test `Select canceled value still
requests close with independent details` fails (1/10 failing), because value
cancellation contaminates close. Restore original source byte-for-byte:10/10 pass.
This independently challenges Select's distinct policy rather than assuming the
Combobox cancellation contract applies. It is a unit negative control; paired
browser mutation evidence remains separate.
