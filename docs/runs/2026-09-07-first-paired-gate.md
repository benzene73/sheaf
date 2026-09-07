# First paired browser gate

Run on Windows, September 7, 2026 around 18:36–18:40 UTC.

Upstream: actual clean Base UI commit
`4d92faa1a4da6a5fe66a6194401470974fc2f8fe`, bundled from its TypeScript source.
Translated target: standalone Phoenix LiveView at `http://localhost:4197/paired`.
Reference target: React fixture at `http://localhost:4198/`.

| Browser | Shared scenarios | Target executions | Result |
| --- | ---: | ---: | --- |
| Chromium 145 | 9 | 18 | 18 passed |
| Firefox 146 | 9 | 18 | 18 passed |
| WebKit 26 | 9 | 18 | 18 passed |

Each scenario executes the same keyboard input and state expectations against
both targets. Expectations measure focus, active descendant text, open state,
and canonical accepted value. Successful traces are also compared directly.

The initial reference-only run failed five scenarios because we wrongly assumed
disabled combobox items were skipped. Actual Base UI permits highlighting these
items (`AriaCombobox.tsx` supplies `disabledIndices: EMPTY_ARRAY`) while refusing
selection. We corrected the consumer configuration and added the disabled Enter
scenario. This discovery came from the real reference, not a custom oracle.

## Negative control

`node harness/negative-control.mjs` temporarily changed the translated forward
loop branch from `index = -1` to `index = minIndex`. The same Chromium suite then
returned 17/18: only LiveView's forward loop scenario failed. Actual value was
Apple where the reference and contract require no active descendant. All nine
upstream target executions still passed.

The script restored original bytes and rebuilt the normal bundle in `finally`.
Before/after source SHA-256 matched:
`399eab92d6572d093f1a1c36686255feb6cbdf3b9091adb3e59da94a5cceab69`.
The restored Chromium suite then passed 18/18.

Raw JSON artifacts in the harness worktree:
`artifacts/paired-results.json`, `artifacts/paired-other-browsers.json`,
`artifacts/negative-results.json`, `artifacts/negative-control.json`, and
`artifacts/restored-results.json`. These are regenerable ignored run outputs.

## Scope

This proves a bounded source-translated navigation slice under nine scenarios,
not combobox parity. Visibility branches, input filtering, async result ownership,
IME, pointer behavior, reconnect/patch lifecycle, nested overlays, real mobile,
and assistive technology remain unproven by this suite.

Reviewer independently inspected the source and harness before the mutation run,
and judged the slice adequate for the first gate subject to passing pair and
mutation evidence. Final acceptance remains the coordinator's decision.
