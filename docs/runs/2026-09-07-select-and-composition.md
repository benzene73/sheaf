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

Select form/pointer extras subsequently passed **36/36** across all engines:
pointer acceptance, native submission, controlled-value reset behavior, Tab,
and modal/nonmodal outside activation. Native reset preserves this controlled
value in the actual upstream fixture; no reset-to-default policy was invented.
The first lookup run failed because the fixture counter names differed; aligning
the shared counter name exposed the actual passing behavior. The Tab precondition
waits for initial option focus, not merely popup opening. Raw report:
`artifacts/select-extra-paired-aligned.json`.

Two cancellation cases expanded the composition/change suite to **30/30** paired
executions: canceled ordinary input restores the displayed canonical text without
opening; canceled composition end restores canonical text while preserving the
already-open popup. This captures a React controlled-input side effect explicitly
in the LiveView adapter. Raw report: `artifacts/composition-cancel-paired.json`.
