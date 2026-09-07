# Standalone bootstrap — September 7, 2026

Executed in Ubuntu WSL from /mnt/d/liveview-primitives-lab:
- mix deps.get: success; versions recorded in mix.lock (LiveView 1.2.11).
- mix compile --warnings-as-errors: success. phoenix_template dependency emits
  an Elixir pin-syntax warning; no lab compilation warnings.
- mix phx.server: serves localhost:4197 independently.
- node test.cjs: all 8 historical remote-search checks pass, zero browser errors.
- node --test tests/unit/list-navigation.test.cjs: 8 algorithm checks pass.

The unit tests use mocked element visibility; real visibility parity requires
browser scenarios. Historical tests still use machine-local Playwright paths;
the paired harness provides portable dependencies. No paired parity established
by these bootstrap commands alone.
