# Independent Combobox change/composition review

Inspected `src/behavior/combobox-change.ts`, `src/liveview/ported-combobox.ts`, paired LiveView fixture and actual pinned Base UI `ComboboxInput.tsx:241-333`. Independently ran 11 source units: 11/11 passed.

The source extraction preserves ordinary versus replacement-text input, composition-local text instead of premature query filtering, Android's intentional composition-start bypass, early cancellation, shared clear details, and callback-sensitive currentTarget.value rereads. These are meaningful source-derived distinctions; they should not be replaced with one generic input handler.

The LiveView adapter invalidates pending selection at input and composition start, retains the existing generation/request guard, and separately reconciles canonical accepted values on patches. During composition, updated() restores composingValue; filtering uses queryValue rather than raw composing DOM text. Source inspection supports these boundaries, but a server patch during active composition and duplicate post-composition native input still need browser scenarios. Synthetic composition tests do not validate physical keyboards or Android.

## Open cancellation concern

At inspection, the adapter's requestInput cancels details for data-cancel-input but does not restore input.value to its prior canonical query. sync() updates filtering and ARIA only. Thus DOM text may diverge from queryValue after a canceled input, unlike React controlled input restoration. The flag is not yet wired in the server fixture, and the current three-scenario composition suite does not assert this path. Reported to root and harness owner for an actual paired canceled-input DOM-value scenario. This is a source-supported risk, not a claimed browser reproduction.

Key/close/selection input setters also bypass this change-handler-specific cancellation flag. If the fixture intends the flag to model all onInputValueChange callbacks, those paths need a shared callback policy; otherwise explicitly document cancellation as input-change-only.

## Gate

Source extraction passes this bounded review. Integration cancellation acceptance is pending the new browser scenario. Existing async bridge evidence predates this composition integration and should be rerun rather than assumed to cover its new event ordering. No full Combobox or complete IME parity is asserted.

## Cancellation follow-up

The adapter now has one requestInput(value, details) path shared by change, keyboard, close and selection updates. Canceled requests restore input.value from queryValue. The harness agent added actual upstream-versus-LiveView typed-input and composition-end cancellation cases; `D:/liveview-primitives-harness/artifacts/composition-cancel-paired.json` records 30/30 across three engines. Source inspection confirms the shared setter and restoration fix. The initial cancellation finding is closed for this tested contract. Physical IME and arbitrary patch/selection event interleavings remain outside that evidence.
