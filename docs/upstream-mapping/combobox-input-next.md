# Proposed next source translation: single Combobox input lifecycle

Status: extracted in `src/behavior/combobox-input.ts` after coordinator confirmed
independent navigation gate. Twelve direct unit tests pass; removal of the
selected-value cancellation guard causes test 9 to fail; restored source passes.
Paired browser and independent review of this second slice are still pending.
Pin: `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

## Bounded target

Single selection, input outside popup, non-inline, non-grid, no chips. This is
not a claim that omitted multi-select, inline, transition or pointer paths work.
Translate three sequential source units rather than inventing one replacement
state machine: Input keyboard decisions, selected-value request ordering, and
close-completion input synchronization.

### Keyboard decisions

`combobox/input/ComboboxInput.tsx:335–457`:

1. Modifier keys return without handling.
2. Record keyboard modality before disabled/readOnly guards.
3. Disabled/readOnly returns; readOnly Enter with open popup and active item
   cancels the event so it cannot submit the surrounding form.
4. Home/End cancel the event, set selection range, reset input scroll. Gecko RTL
   swaps logical caret endpoint; End scroll is negative for RTL.
5. Escape when popup is unmounted requests empty input then null selected value
   using the SAME mutable event-details object. If previously selected and not
   inline, stop propagation unless explicitly allowed by callback. This is
   different from Escape while open, which belongs to useDismiss.
6. IME key code 229 exits before Enter selection.
7. Enter while open and no active item requests close but does NOT prevent form
   submission. Inline variant omits the close (outside this slice).
8. Enter with active item cancels event and clicks highlighted item. Item click
   handler separately rejects disabled/readOnly; disabled can stay highlighted.

Proposed extraction API:

```
runSingleInputKey(state, event, effects)
state: { disabled, readOnly, open, mounted, activeIndex, selectedValue,
         direction, gecko, inputValue, inputScrollWidth, inputClientWidth }
event: { key, ctrlKey, shiftKey, altKey, metaKey, which,
         preventDefault(), stopPropagation(), nativeEvent }
effects: { markKeyboard(), setCaret(index), setScrollLeft(number),
           requestInput(value, details), requestValue(value, details),
           requestOpen(value, details), clickActive(index, nativeEvent) }
```

Callbacks retain upstream ordering. Pure decision tables alone must not reorder
callbacks, because callbacks can cancel or allow propagation midway through.
The extraction must not silently treat `isComposing` as equivalent to every
upstream IME branch: key code 229 is the exact branch above; composition input
updates are a different source unit.

### Selection ordering

`combobox/root/AriaCombobox.tsx:831–855` (`setSelectedValue`) and `:910–919`
(`handleSelection`, single branch):

1. Invoke onValueChange(next, details).
2. If canceled, return before state mutation or close.
3. Assign selected state (uncontrolled changes locally; controlled setter does
   not override the parent-provided value).
4. Outside-popup single mode requests input label with fresh details carrying
   the original reason/event.
5. Return to single handleSelection; if original details canceled, return.
6. Request close using original details.

Close request itself invokes onOpenChange and may be canceled independently.
Selection cancellation and close cancellation are not equivalent: a committed
value may coexist with an open popup when only close is canceled.

Proposed API:

```
runSingleSelection(nextValue, details, effects)
effects: { requestSelectedValue(nextValue, details), requestOpen(false, details) }
```

`requestSelectedValue` is the separately translated ordered callback/state/label
unit. No Promise exists in upstream callback cancellation; do not present async
server validation as the same primitive contract.

Implemented exports are `runSingleInputKey`, `requestSingleSelectedValue`,
`runSingleSelection`, `completeSingleClose` and `createChangeEventDetails`.
`InputKeyState`, `InputKeyEvent` and effect interfaces are exported from the same
module. Keyboard function returns whether a branch handled the key; this must
NOT be interpreted as preventDefault. The no-highlight Enter branch returns true
but deliberately allows native form submission. Active indices use null for none
(the list-navigation adapter must convert its -1 sentinel).

`createChangeEventDetails` directly translates the upstream helper's mutable
closure/getter semantics and custom-property spread order. Its TypeScript type
uses general Event rather than upstream's full reason-specific event union.

### Close completion

`AriaCombobox.tsx:927–970` (`handleUnmount`): mark unmounted, call completion,
clear query-changed/close-query state and active index. For single outside input,
restore selected label only if it differs from current input; reason input-clear
for empty label, otherwise none. Input-inside-popup instead clears input, and
multiple has its own clear behavior. Restoration belongs to completion, not the
initial Escape event, so exit animation keeps filtering stable.

## LiveView contract boundary

The browser owns transient open/highlight/query. Server owns accepted value.
For a server-backed selection proposal, the bridge must explicitly pause between
proposal and the accepted value/close continuation. Rejection preserves accepted
value and open state; acceptance may fill the label and request close. A newer
input generation or proposal invalidates the older continuation. Completion of
an old proposal must never close a newly opened/query-modified popup.

This asynchronous pause is an intentional LiveView adapter extension, not a
literal translation. It requires separate delayed acceptance/rejection/reorder
tests. Source parity can compare final observable states and callback ordering,
but must not claim zero-latency parity or synchronous DOM availability.

Controlled upstream value and browser input are separate: controlled parents may
ignore requested values without calling cancel. Document whether the LiveView
ack marks acceptance or mere receipt; receipt must never imply acceptance.

## Upstream test anchors

- Root test `"single" keeps the popup open when selection is canceled`, :6775.
- Root tests `submits on Enter when no item is highlighted (does not prevent)`
  :11150 and `prevents submit on Enter when an item is highlighted`, :11190.
- Root test `should not submit the form with Enter on a highlighted item when
  readOnly`, :5068.
- Root tests around :6884 cover canceled item-press close preserving input filter.
- Root test :1131 `should reset input value to selected value when popup closes
  without selection`: outside input default apple; open/select apple, reopen,
  type xyz (input applexyz), outside-click closes, input restores apple and
  onInputValueChange reason is none. This is the matching close-completion test.
- Root test :314 covers Escape with input INSIDE popup; use it only for that
  future composition, not as evidence for outside-input label restoration.

Port the :1131 composition into shared browser scenarios. Add independent
LiveView delayed-ack tests rather than weakening shared upstream scenarios.

## Local test scope and negative control

Run `node --test tests/unit/combobox-input.test.cjs`. Twelve tests check callback
ordering, cancellation, event propagation, readOnly Enter, no-highlight native
submission policy, code229 guard, RTL/Gecko caret decisions and close restoration.
These are effect-double tests, not browser integration evidence.

The keyboard return value reports only this input branch. Upstream composes
floating list-navigation separately: readOnly returns early here but still permits
ArrowDown browsing through that other handler. A host must not treat handled=true
as permission to skip all composed handlers. Event default/propagation state and
the individual composed primitive's rules decide that separately.

Negative control run: remove `if (details.isCanceled) return` immediately after
onValueChange in requestSingleSelectedValue. Test9 fails because rejected values
reach assignment/input effects. Source was restored byte-for-byte and all12 pass.
This is separate from, and does not substitute for, paired browser mutation tests.
