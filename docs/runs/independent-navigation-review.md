# Independent review: bounded list-navigation gate

Verdict: PASS for the mapped vertical, virtual-focus, non-grid list-navigation unit and its nine shared scenarios. This does not certify a complete Combobox, async selection, popup positioning, or all LiveView lifecycle behavior.

## Source and provenance

Reviewed `src/behavior/list-navigation.ts`, its mapping and eight unit tests against Base UI pin `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`. The index scan, visibility/native-disabled precedence, opening endpoint, loop clamping, input-inclusive escape sentinel and editable Home/End branches preserve the inspected upstream semantics. Unit tests independently rerun: 8 passed.

The React harness resolves Base UI imports into that actual pinned clean checkout, fails on a different/dirty source, and emits a bundle metafile containing `composite.ts`, `useListNavigation.ts`, and `ComboboxRoot.tsx`. This establishes actual upstream execution rather than a recreated oracle.

## Important discrepancy discovered and corrected

`AriaCombobox.tsx:1370` passes `disabledIndices: EMPTY_ARRAY`. Consequently an aria-disabled option can be highlighted during navigation but cannot commit. Opening still skips attribute-disabled items. The initial adapter omitted the consumer argument and the first harness expectations incorrectly assumed disabled items were skipped. Upstream browser results exposed Banana as highlighted. Correcting the adapter and expected contract from the source was necessary; the helper itself already supported the distinction. The current harness explicitly tests disabled highlight with Enter producing no commit.

## Independently inspected artifacts

Artifacts live in `D:/liveview-primitives-harness/artifacts/`:

- `paired-results.json`: Chromium, 18/18 target scenarios pass.
- `paired-other-browsers.json`: Firefox/WebKit, 36/36 target scenarios pass.
- `negative-results.json`: 17/18; exactly LiveView forward input-inclusive wrapping fails. The active item is Apple where none was expected after Cherry; no browser exception caused the failure.
- `negative-control.json`: deliberate forward allowEscape `index = -1` changed to `minIndex`; negative process exits1; original and restored SHA256 are identical.
- `restored-results.json`: Chromium 18/18 pass after restoration.

Current source SHA256 independently checked: `399eab92d6572d093f1a1c36686255feb6cbdf3b9091adb3e59da94a5cceab69`, matching the recorded before/after hash.

The same browser actions and active/focus/open/accepted-value assertions run against both implementations. Both wrap directions, clamp configurations, Home/End, disabled selection rejection and enabled selection are covered. The negative control proves the harness distinguishes a genuine translated-behavior regression rather than merely checking both pages render.

## Limits and next risks

Do not extrapolate this54-case result to complete component parity. Not certified here: filtering, pointer policy, scroll scheduling, async acceptance/rejection, reconnection, arbitrary patched node replacement, or a currently active option becoming hidden/disabled. Physical-device and screen-reader tests remain separate.

The next input-lifecycle mapping correctly separates synchronous upstream cancellation from an asynchronous LiveView extension. Its acceptance acknowledgement must mean accepted value, never just event receipt. Stale continuations must be rejected after query/open/proposal changes; close cancellation differs from selection cancellation; controlled parent ignoring a proposal is not the same as explicit cancel. Test those separately before claiming the adapter preserves the composed state semantics.

Minor documentation caution: non-typeable Home/End can return raw out-of-bounds sentinels for empty/all-disabled lists, as upstream does. The host must normalize those before publishing aria-activedescendant, just as with opening. Not relevant to the certified editable cases.
