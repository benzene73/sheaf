# Integrated Chromium gate

Run: 2026-09-07 20:04:12–20:07:11 UTC, from the main lab checkout.
Command: `npm run test:browser`.

**22/22 suites passed.** The actual pinned React source was rebuilt and served
from the main checkout at 4198; LiveView ran under Ubuntu WSL at 4197. Upstream
build provenance confirms clean tracked source at
`4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

## Shared React / LiveView cases

| Suite | Passed target executions |
| --- | ---: |
| Combobox navigation | 18 |
| Distinct combobox labels / submitted IDs | 4 |
| Combobox input and close lifecycle | 18 |
| Filtering / canonical form values | 10 |
| Synthetic composition / cancellation | 10 |
| Menu | 32 |
| Menu scroll ownership | 4 |
| Select keyboard / cancellation | 20 |
| Select pointer / forms | 12 |
| Positioning | 10 |
| Popover focus / dismissal | 12 |
| Dialog | 12 |
| NumberField | 12 |
| Tabs | 12 |
| Tooltip | 8 |
| Accordion | 8 |
| ToggleGroup | 8 |

That is **105 shared scenarios, each passing on both targets**. Target executions
are not additional unique scenarios or evidence of full component compatibility.

## LiveView-specific integration

- Selection bridge: six cases covering delayed/reversed replies, rejection,
  external accepted state and patches.
- Lifecycle: four cases covering composition patches, removed/replaced options
  and remount ownership.
- Actual hook isolation: sibling reply isolation and old-lifetime rejection.
- Reusable component API: one workflow covering Select labels/decoration/form
  value, Menu events, Dialog Save patches and Popover Escape.
- Nested form: one workflow covering Select inside Dialog, child-only Escape,
  selection/Save patches and final focus return.

Raw output is under ignored `artifacts/current`. The bridge script initially
wrote its own report path; that unchanged report was copied into the current
folder, and the script now respects `REPORT_PATH` for future runs.

## Other checks

- `npm run typecheck`: passed.
- `npm run test:unit`: **108/108 passed** after integrated implementation changes.
- WSL `mix compile --warnings-as-errors`: passed.
- WSL `mix format` and `git diff --check`: passed.
- Desktop playground and public positioned Combobox screenshots inspected.
- Separate focused public Combobox viewport and closed-canonical-label probes
  passed; see `combobox-public-positioning.md`.

Current verification scope is Chromium only, as requested. Earlier Firefox and
WebKit reports remain historical. Synthetic composition is not physical IME
certification. Tooltip's zero-delay fixture is explicit; default hover timing is
covered by the focused source-policy test, not those zero-delay browser cases.

No expansion of passing families into further edge-case matrices was performed.
Component mappings, state-ownership docs and the adoption assessment describe
what remains unimplemented or unverified.

## Final native-menu integration addendum

After the core 22-suite gate, native form actions were added through the public
menu/native_actions/menu_submit API. Four shared cases passed on React and
LiveView (8 target executions), and the existing 16 Menu cases passed again
(32 target executions). See `2026-09-07-menu-native-submit.md`. This brings the
unique shared-scenario count to 109 (218 target executions), without rerunning
unaffected families. The current browser runner contains 23 suites; the full
23-suite command was not rerun as a separate batch.

After this implementation change, TypeScript, all 111 unit tests, the private
ESM/declaration build, WSL formatting and compilation passed. Independent source
review found no blocker in the bounded native-submit path. Native anchor/link
items and arbitrary external form ownership remain outside that browser gate.
