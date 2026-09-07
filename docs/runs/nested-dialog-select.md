# Ordinary edit-form composition

Chromium-only smoke passed using the actual reusable `LiveViewPrimitives.Components.dialog` and `.select`, nested in a LiveView form at `/nested`.

One workflow: open Edit profile; open Country select; Escape closes only the select, leaves the dialog open and returns focus to the select trigger; reopen and select India; server selection patch retains the dialog; Save submits `IN` and patches the page while retaining the dialog; Close returns focus to Edit profile. No browser page errors.

Run: `node harness/nested.mjs`. Artifact: `artifacts/nested-smoke.json`. Fixture: `lib/lab/nested_live.ex` with unique component IDs and scoped selection events. This verifies an ordinary nested form path, not arbitrary nested overlay parity, all browsers, or production app adoption.
