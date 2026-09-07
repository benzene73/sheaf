# Independent review: bounded single-input lifecycle

Source review: PASS for the mapped single-selection, outside-input, non-inline, chipless branches in `src/behavior/combobox-input.ts`. This is not a complete ComboboxRoot or async bridge certification.

Compared directly with pinned Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`, ComboboxInput keyboard branch and AriaCombobox selected-value/selection/close-completion branches. Modifier return, keyboard-modality ordering, readOnly Enter cancellation, Home/End, closed Escape sharing mutable details,229IME guard, active versus inactive Enter behavior, selection cancellation ordering, fresh label-update details and late input read at completion match inspected source.

## Independent verification

`node tests/unit/combobox-input.test.cjs`:13/13 passed. Made a separate ignored scratch copy removing only the selected-value cancellation guard; same tests against copy:12/13 passed, canceled selection test fails because assignment/input effects run. Main source was never mutated. Artifact: `artifacts/reviewer-input-negative.log` and reviewer-input-mutant files.

Reviewed shared lifecycle scenarios: selection cancellation waits for value-change completion instead of accepting unchanged pre-ack state; readOnly navigation plus Enter blocked; active/inactive Enter form behavior; independently canceled close; open/closed Escape; close-completion restoration and caret. Final paired browser artifact verification pending at time of initial review; coordinator should append final run evidence before broader claim.

## Important adapter finding reported

The inspected adapter checked stale `intent`/request identity before reconciling server-accepted value. If a proposal is accepted while the user types or dismisses, the server value changes but the callback is discarded; `updated()` only synced visibility and never copied accepted data. The browser could retain old accepted state and restore its old label later. Preventing a stale close continuation is correct; losing canonical accepted reconciliation is not. Must separate accepted-value version reconciliation from UI continuation validity, or invalidate the proposal server-side. Source-confirmed control-flow defect, not yet a browser reproduction in this review. This prevents claiming asynchronous acceptance correctness until fixed and tested.

Other uncertified bridge boundaries: cached input/list nodes across replacement; client filtering is independent scaffold; open/dismissal/filtering are not a port of the full upstream interaction stack; no exit animation (completion immediate); selected labels currently string identity; controlled-value semantics depend on an explicit server acknowledgement contract.

A stale acceptance must not close a newly reopened/query-modified popup. A rejection must preserve server canonical accepted state. Event receipt alone must not count as acceptance. Link options remain excluded unless their separate upstream guard is mapped. These are requirements for subsequent adapter tests, not reasons to reject the faithful pure source unit.

## Follow-up: bridge correction verified

Reviewed revised bridge/server and artifacts `artifacts/liveview-bridge-results.json` (18/18, six cases across three engines) and `artifacts/lifecycle-after-async.json` (54/54 paired target scenarios). The earlier canonical-state finding is addressed: `updated()` reconciles accepted state independently; query/dismiss changes send generation invalidation; server checks current proposal/generation before committing; UI continuation still rejects stale replies.

Bridge tests wait for server pending/settled counters rather than timing guesses. They cover new query during pending selection, dismissal, newer proposal, delayed rejection, external accepted update followed by label restoration, and unrelated patch preserving focus/active item. This is meaningful regression evidence for the corrected contract. It is separate from upstream synchronous parity. The newer-proposal test uses equal configured delays, so it establishes stale pending work exclusion, not every possible reverse completion ordering. Arbitrary node replacement/reconnect and physically reordered transport are not certified.

Bounded input lifecycle verdict: PASS with the inspected cross-browser evidence and corrected bridge contract. No complete-combobox claim follows.
