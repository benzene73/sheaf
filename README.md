# LiveView Base UI port playground

Experimental local repository. No full Base UI compatibility or production claim.
The pinned source is `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
Read PORTING.md and ARCHITECTURE.md before changing behavior.

## Runtime

The lab is now an independent Phoenix application, with its own mix.lock and
compiled dependencies. It does not start or depend on the Kaguya application.
It uses no database. On the current machine run under Ubuntu WSL:

```sh
cd /mnt/d/liveview-primitives-lab
mix deps.get
mix compile --warnings-as-errors
mix phx.server
```

Default port is 4197; override with PORT. The JavaScript entry is client.js and
must be bundled into priv/static/app.js after installing Mix dependencies; its
Phoenix imports resolve from this project's deps. The paired harness supplies
its own Node dependency setup separately.

- `/`: historical remote-search trial; independently written behavior, not a port.
- `/paired`: bounded source-translated navigation fixture, plus a thin LiveView adapter.

`server.exs` is the historical single-script bootstrap and should not be used for
current runs. The app source now lives under lib/lab, one module per file.

## Evidence boundaries

Mapping and divergences: docs/upstream-mapping and docs/known-divergences.
Historical evidence: RESULTS.md, REVIEW.md and docs/history/ten-minute-trial.md.
New browser runs belong under docs/runs. Passing bounded navigation checks is
not evidence of full combobox state, async search, dialogs, positioning, screen
readers, reconnect, or IME coverage. Those need their own mapped implementations
and tests. No Kaguya/Nila application source or data is changed by this lab.
