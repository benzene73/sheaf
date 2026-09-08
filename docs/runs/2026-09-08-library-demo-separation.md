# Library/demo separation

The root app is now `:sheaf`, with Phoenix LiveView and Jason as its only direct
runtime dependencies and no application callback. All original `Lab.*` fixtures
moved from `lib/lab/` to `demo/lib/lab/`. The independent `:sheaf_demo` Mix app
depends on `{:sheaf, path: ".."}`, owns Bandit/configuration/static assets, and
keeps the default playground port 4197. Historical bootstrap and evidence files
remain preserved.

Packaging references inspected locally: `pui/mix.exs`, `pui/demo/mix.exs` and
`petal-components/mix.exs` under `D:/kaguya/tmp/design ref/`. PUI's library/demo
split and both libraries' no-callback applications support the structure here;
no implementation code was copied from these references.

Verification under Ubuntu WSL / Elixir 1.20.4 / OTP 27:

```sh
cd /mnt/d/sheaf
mix compile --warnings-as-errors
mix run artifacts/check-library.exs
cd demo
mix deps.get --check-locked
mix compile --warnings-as-errors
mix run --no-compile --no-start ../artifacts/check-demo-dependency.exs
```

All passed. Root runtime applications were `:kernel`, `:stdlib`, `:elixir`,
`:logger`, `:phoenix_live_view`, `:jason`; no Lab endpoint or supervisor started.
Only Sheaf modules appeared in the library application. The demo resolved Sheaf
to `/mnt/d/sheaf` and loaded its BEAM from `demo/_build/dev/lib/sheaf/ebin/`.
The ignored smoke scripts in `artifacts/` assert these conditions locally.

Fresh demo dependency compilation emitted an upstream `phoenix_template` warning
about bitstring size pinning under Elixir 1.20; library and demo source compilation
passed with warnings treated as errors. Dependency versions remained unchanged.

`npm run build:liveview` passed using `demo/assets/client.js` and generated
`demo/priv/static/app.js`. The asset is ignored. No package was published and no
production application was edited. This compilation checkpoint predates the
new forms/composition fixture edits; the final integration report covers those.

The FormField tests now use the conventional `test/sheaf/form_field_test.exs`
location with `test/test_helper.exs`. Running `mix test` from the repository root
passed all three tests without starting the demo or requiring a custom script.
