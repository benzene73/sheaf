# Paired browser harness

This fixture imports the actual pinned Base UI TypeScript source, not an npm
release assumed to match it. `build-upstream.mjs` refuses a different commit or
modified tracked files. Its esbuild metafile and provenance record are generated
under `artifacts/upstream/`.

```powershell
npm ci
npx playwright install chromium firefox webkit
npm run build:upstream
npm run serve:upstream
# In another shell, with the standalone LiveView fixture running on 4197:
$env:BROWSERS='chromium,firefox,webkit'
npm run test:paired
```

Set `BASE_UI_SOURCE` before building if the pinned clone is not at
`../kaguya/tmp/design ref/base-ui`. `UPSTREAM_PORT`, `UPSTREAM_URL`, `LIVEVIEW_URL`,
`BROWSERS`, and `REPORT_PATH` configure independent runs. `UPSTREAM_ONLY=1` is
diagnostic only and is not paired parity evidence.

Nine shared scenarios exercise the bounded vertical navigation contract. Both
targets receive identical real keyboard actions and identical semantic assertions
for input focus, highlighted item, expanded state, and accepted value. No arbitrary
sleeps, framework-specific dispatch, or alternate LiveView success path is used.
Both fixtures advertise readiness through `data-fixture-ready="true"`.

## Important observed correction

The first upstream run passed 3/8 scenarios and contradicted our assumption that
disabled combobox items are skipped. Actual Base UI highlighted disabled Banana.
Inspection then identified `AriaCombobox.tsx` line 1370 supplying
`disabledIndices: EMPTY_ARRAY`; disabled items are discoverable by highlight but
cannot be committed. Expectations and the LiveView consumer configuration were
corrected to this actual upstream contract; a dedicated disabled Enter test was
added. The generic list algorithm's default skip behavior remains a separate
unit-level capability, not the combobox's consumer configuration.

The suite does not certify the whole combobox: filtering, async results, IME,
pointer interactions, patch recovery, mobile viewport behavior, and screen readers
remain separate work. The first gate also requires an independently reviewed
mutation run showing an intentionally broken translation fails these same tests.
