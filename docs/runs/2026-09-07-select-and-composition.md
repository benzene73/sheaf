# Select keyboard and synthetic composition gates

The first ten Select scenarios passed **60/60** paired executions on Chromium,
Firefox and WebKit. The fixture explicitly uses `alignItemWithTrigger=false`;
the source default alignment mode is not covered. Scenarios include clamped
arrows, disabled highlighting but refused selection, endpoints, closed/open
typeahead, selection cancellation, acceptance and Escape focus return.

Combobox change/composition scenarios passed **18/18** on the same engines:
clearing text clears selection; `insertReplacementText` updates input without
opening; composition keeps the unfiltered options until composition end.
These use identical synthetic DOM composition/input events in both targets,
with native input value setter and observable state assertions. They do not
prove physical IME, Android keyboard or OS autofill behavior.

Raw outputs: `artifacts/select-paired.json`, `artifacts/composition-paired.json`.
Commands: `harness/select.mjs` and `harness/composition.mjs` with
`BROWSERS=chromium,firefox,webkit`.

Select form/pointer extras have reference-only evidence at this point and must
not be counted as paired coverage until the adapter fixture is tested.
