# Single outside-input change and IME policy

Pin Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
`src/behavior/combobox-change.ts` directly extracts ComboboxInput.tsx
onCompositionStart/onCompositionEnd/onChange (:241–333), bounded to single mode
with input outside popup. MIT notice in `licenses/BASE-UI-MIT.txt`.

## API and ownership

createComboboxChangeController({getState,android,setComposingValue,requestInput,
requestValue,requestOpen,clearHighlight}) returns composition-start/end/change
handlers. Pass currentTarget (actual input, so reads remain live) and nativeEvent.
State includes open, readOnly, disabled, openOnInputClick, activeIndex and
autoHighlightEnabled. clearHighlight must clear both active/selected indices with
the host's current keyboard/pointer reason, as upstream does.

Non-Android composition start sets a browser-only composing value. Changes during
composition update it and can open the popup, but do not propagate the canonical
query or clear selected value; composition end clears local composition override
and requests the committed query with input-change reason. Android deliberately
does not enter this state due to keyboards that report perpetual composition.
Do not turn this into a blanket filter-on-every-composition-update implementation.

Input without inputType, or insertReplacementText, is autofill-like: it updates
query but does not request opening. Ordinary typed nonempty input requests open
unless disabled/readOnly. Canceled input request returns before further changes.
Empty single input requests null selected value; closes only when
openOnInputClick=false (upstream defaulttrue). The clear-value and close requests
share details; cancellation is observed by those underlying setters. Source does
not add a second early-return between them.

Callbacks can mutate the input: subsequent source currentTarget.value reads are
preserved, not replaced with an early copied string. The open/disabled/readOnly
values are captured per handler, while activeIndex/openOnInputClick read current
store state through getState at their original points.

## Boundaries and tests

Eleven unit cases exercise exact ordering, IME deferral, Android branch,
autofill-like input, cancellation, empty-query policy and late value reads.
Upstream Root tests :8750 `highlights the first matching item after IME
composition` and :8849 `does not run follow-up state changes after canceled input
value changes` are key browser oracles. Auto-highlight selection itself belongs
to Root pendingQueryHighlight and is not ported by this input unit.

This is not full React event normalization or native autofill integration.
Field validation, selectionMode none/multiple, input-inside-popup, inline blur
restoration and chips are excluded. Synthetic tests are not physical IME/Android
keyboard validation. Native input events should be mapped intentionally to React
onChange semantics; duplicate compositionend/input events need browser tests.

LiveView generation invalidation and pending response rejection remain separate
adapter extensions. A browser-local composition value must not be overwritten by
a server patch, but no remote-search protocol is invented by this extraction.
