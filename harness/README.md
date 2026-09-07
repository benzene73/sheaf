# Paired browser harness

This fixture imports the actual pinned Base UI TypeScript source, not an npm
release assumed to match it. `build-upstream.mjs` refuses a different commit or
modified tracked files. Its esbuild metafile and provenance record are generated
under `artifacts/upstream/`.

```powershell
npm ci
npx playwright install chromium
npm run build:upstream
npm run serve:upstream
# In another shell, with the standalone LiveView fixture running on 4197:
npm run test:browser
```

Set `BASE_UI_SOURCE` before building if the pinned clone is not at
`../kaguya/tmp/design ref/base-ui`. `UPSTREAM_PORT`, `UPSTREAM_URL`, `LIVEVIEW_URL`,
`BROWSERS`, and `REPORT_PATH` configure independent runs. `UPSTREAM_ONLY=1` is
diagnostic only and is not paired parity evidence.

The first nine shared scenarios exercise the bounded vertical navigation contract. Both
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

That first suite does not certify the whole combobox. Separate suites now exercise
filtering, synthetic composition, pointer/form interactions, patch recovery and
the server-acceptance bridge. Other families have their own bounded suites.
Read the individual run ledgers for precise coverage. Real screen readers,
physical IME/mobile input and full upstream compatibility remain outside these
checks. Negative controls prove selected intentionally broken translations fail.

Current work targets Chromium only. Historical Firefox/WebKit reports are retained
but do not imply that later components were tested there. `npm run test:browser`
forces Chromium and records each selected suite under `artifacts/current`.
Pass names to run only affected families, for example `-- tabs tooltip`.
