# Independent menu typeahead/adapter review

Source unit: PASS. The extracted prefix matching, normalized wrap start, selected/current-index session start, repeated-letter cycling, double-letter exception, visibility/native/explicit-disabled filtering, timeout/blur/reset behavior match pinned Base UI useTypeahead. MenuRoot's500ms consumer timeout is correctly distinguished from generic750ms. Independently ran12unit tests: all pass. This does not make the surrounding native menu a complete Menu port.

## Adversarial adapter findings

Actual Chromium probes against upstream4198 and LiveView4197 exposed gaps outside the initial ten scenarios:

1. ArrowDown then Space: upstream invokes Alpha and closes; LiveView closes but action remains empty. Div menuitems require Space activation, coordinated with in-progress typeahead (space inside a prefix must not activate).
2. ArrowDown then Tab: upstream closes and focuses Outside; LiveView remains open/focus Alpha. Native popover dismissal does not supply Menu's tab/focus-guard contract.
3. Open then click an independently appended fixed-position outside button: upstream leaves focus on the clicked button; LiveView closes and steals focus back to trigger. Source onToggle unconditionally focuses trigger for every close, without cause distinction. Escape/action focus restoration must not override outside-click focus.

Scripts under artifacts/reviewer-menu-{probe,live,outside}.cjs use real mounted pages. Initial outside probe was obstructed by the popup because the appended button occupied overlapping geometry; the corrected probe positions it fixed right20/top200 and succeeds on both. These are observational150ms probes, not retained paired-suite evidence yet. Coordinator/harness notified to make durable scenarios and verify fixes.

The harness also independently found keepOpen action patch reset aria-expanded=false while popup stayed open (57/60 first matrix). Correct client-owned ARIA restoration on updated is needed; source typeahead itself is not responsible.

## Boundaries

No nested menu, submenu safe pointer corridor, arbitrary patched nodes, full FloatingFocusManager, link semantics or disabled root certification. The existing source mappings honestly exclude them. Highest-value next action is fixing and pairing Space/Tab/outside focus before describing this adapter as generally usable, while retaining the narrower typeahead source-pass claim.

## Follow-up source review and composition correction

Reviewed new menu-activation unit against useButton's non-native, non-link composite branches and the menu typing guard. Space/Enter handling is source-derived for that bounded composition; native buttons/links and arbitrary click listeners are not certified by this callback adapter. Filter source also reviewed against collator/label/query/flat-item branches:11unit tests pass; no differing branch found in the bounded scope.

Clarification to outside-pointer probe: the appended fixed button was outside the React fixture and could paint above its internal backdrop. The default modal Menu's existing outside button is intercepted by the backdrop; expected behavior is dismissal/trigger focus without invoking the button. A true nonmodal fixture is necessary to evaluate outside action/focus preservation. Harness now distinguishes modal and nonmodal scenarios rather than treating the appended-button probe as universal expected behavior.

Root changed Space activation, Tab close ordering, close-cause focus handling, explicit modal backdrop composition and post-patch ARIA restoration. Expanded paired run verification is pending here. One source-preserved quirk was additionally probed: type b, Escape, reopen, Space leaves the menu open/no action in both implementations; the open-state effect cancels typing timeout without publishing typing=false. This is not a port-only defect.

## Final expanded menu artifact verified

Independently inspected `D:/liveview-primitives-harness/artifacts/menu-final-paired.json`:96/96 target executions,32per engine (sixteen scenarios against both targets). Space, Tab/reverse Tab, typeahead-space distinction, modal pointer interception, nonmodal activation/focus policy and keep-open ARIA patches now have shared passing evidence. Earlier adapter findings are closed for these exercised compositions. WebKit nonmodal pointer focus differs from Chromium/Firefox in upstream itself; the harness applies the observed engine-specific expectation identically to both targets, rather than masking a LiveView failure.

Menu verdict: bounded sixteen-scenario adapter PASS, source typeahead/activation PASS. Scroll ownership has separate standalone review; this96-case artifact alone is not universal modality, submenu or assistive-technology parity.
