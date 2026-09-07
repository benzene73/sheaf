# LiveView primitives viability lab

Experimental local repository. No published package or Base UI compatibility claim.
The trial implements a source-informed combobox behavioral contract, not a
mechanical Base UI implementation port. See PORTING.md.

## What ran

Real Phoenix Endpoint and LiveView on WSL, real WebSocket updates and server-rendered
options, Chromium automation on Windows. No database, React or simulated LiveView.
During the ten-minute trial, the server borrowed Kaguya's already installed Mix
runtime/dependencies; it does NOT start Kaguya's application. Its source is separate.
The minimal mix.exs is supplied for later standalone setup; its independent dependency
resolution was not run in this trial. Likewise the JS imports/test runtime currently
point at this machine's installed Phoenix assets and Playwright. These are explicit
bootstrap shortcuts, not the proposed public-package distribution design.

## Re-run with this workspace's existing tools

From PowerShell:

```powershell
& D:/kaguya/assets/node_modules/@esbuild/win32-x64/esbuild.exe D:/liveview-primitives-lab/client.js --bundle --outfile=D:/liveview-primitives-lab/public/app.js
wsl -d Ubuntu -- bash -lc 'cd /home/benze/kaguya && mix run --no-compile --no-start /mnt/d/liveview-primitives-lab/server.exs'
```

In a second terminal:

```powershell
node D:/liveview-primitives-lab/test.cjs
```

Preview http://localhost:4197. Cherry is deliberately rejected by the server.
Query `slow` returns Apple after a delay; `fast` returns Banana sooner.
Unrelated patch changes real option DOM attributes while preserving active input.
Browser-generated artifacts are ignored; source, specification and review are in repo.

## Not yet proven

Paired execution against upstream Base UI; Firefox/WebKit; screen readers; IME;
outside click; Home/End/typeahead; form reset/recovery; reconnect; nested floating
content; virtualization; animations; positioner; real application adapter costs.
No production app modifications, dependency updates, commits or pushes in this trial.
