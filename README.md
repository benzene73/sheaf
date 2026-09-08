# Sheaf

A source-traceable experiment porting selected **Base UI behaviors to Phoenix
LiveView**. It combines translated policy functions, thin TypeScript hooks, native
browser dialog/popover primitives, and headless Phoenix components. It is not a
complete Base UI port or a production support promise.

Pinned upstream: `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`. Translated files retain
MIT attribution. Mapping, scope and deliberate differences live in
[docs/upstream-mapping](docs/upstream-mapping); see [PORTING.md](PORTING.md).

## Use the library

The root Mix project is the `:sheaf` component library. It has no endpoint,
application supervisor, database or demo configuration. Its direct dependencies
are Phoenix LiveView and Jason; Bandit belongs to the separate demo application.
To consume this checkout from another Phoenix application's `mix.exs`:

```elixir
{:sheaf, path: "../sheaf"}
```

Run `mix deps.get` in the consuming app. Build the client entry in this repository
with `npm ci && npm run build:primitives`, then import `hooks` from the generated
private local package into the application's existing LiveSocket. The generated
`dist/package.json` records runtime dependencies and exports; see
[client build](docs/build.md) for local package installation and
[docs/components.md](docs/components.md) for the component APIs.

There is no published Hex or npm release. The root package file list includes
the reusable Elixir/client code, generated client build, licenses and docs;
it excludes the demo, upstream harness, test artifacts and development tooling.

## Run the demo

`demo/` is an independent Phoenix application with its own dependencies and **no
database**, consuming Sheaf through `{:sheaf, path: ".."}`. Kaguya and Nila
source/data are not part of the application. On the
current machine use Ubuntu WSL for Mix:

```sh
cd /mnt/d/sheaf
mix deps.get
npm ci
cd demo
mix deps.get
cd ..
npm run build:liveview
mix compile --warnings-as-errors
cd demo
mix compile --warnings-as-errors
mix phx.server
```

Open **http://localhost:4197/lab**. `PORT` overrides 4197. Do not run the historical
`server.exs` bootstrap. The demo's configuration lives in `demo/config/`,
fixtures in `demo/lib/lab/`, and browser entry in `demo/assets/client.js`.
Run Mix consistently under one runtime; mixing Windows
and WSL builds in the same `_build` directory causes needless recompilation.

## Components

| Family | Demo | Scope |
| --- | --- | --- |
| Combobox | `/forms`, `/paired`, `/label-combobox` | Native forms, custom option content, optional async approval |
| Menu | `/menu`, `/menu-form` | Single-level actions, native form submissions, navigation, typeahead, dismissal |
| Select | `/select` | Single selection, forms, accepted-value reconciliation |
| Popover | `/positioning?behavior=true&size=normal` | Collision positioning, native top layer, bounded focus policy |
| Dialog | `/dialog` | Native modal, cancelable dismissal, form patches |
| Number field | `/number-field` | Locale parsing, bounds, fractional steps, text drafts, forms |
| Tabs | `/tabs` | Manual activation; `?auto=true` selects on focus |
| Tooltip | `/tooltip` | Focus/hover, Escape/blur, descriptions; fixture uses zero delay |
| Accordion | `/accordion` | Single-open disclosure, keyboard activation, disabled items |
| Toggle group | `/toggle-group` | Pressed buttons, roving focus, single/multiple selection |

`/forms` demonstrates field-backed Combobox, Select and NumberField with validation, submission, resets and custom option content. See [API policy](docs/api-policy.md).

`/components` demonstrates the reusable dialog/menu/select/popover helpers.
`/nested` exercises a Select inside a Dialog through selection and Save patches.
The number/tabs/tooltip/accordion/toggle demos consume the reusable Controls API.
Register individual hooks or the exported `hooks` object from
`src/liveview/index.ts`. Usage and state ownership: [docs/components.md](docs/components.md).
`npm run build:primitives` emits a private ESM bundle and declarations without
React or Phoenix JavaScript imports; see [client build](docs/build.md).

`/` preserves the historical ten-minute prototype. That earlier independent
implementation is **not** evidence of a source port.

## Verify

```sh
mix test
npm run typecheck
npm run test:unit
npx playwright install chromium
npm run build:upstream
npm run serve:upstream
# Another terminal, with both servers running:
npm run test:browser
# Or a bounded family:
npm run test:browser -- tabs
```

The upstream fixture builds the actual pinned React source, rejects a changed
commit/dirty tracked source, and records build provenance. Shared scenarios run
against both React and LiveView. Negative controls and independent review reports
are retained under [docs/runs](docs/runs). Current browser target is **Chromium**;
older Firefox/WebKit runs are historical evidence only.

## Boundaries

This repository ports selected behavioral functions, not React itself. Native
browser substitutions and LiveView server protocols are explicit adaptations.
Menus omit nested submenus; Select omits multiple selection and default
item-aligned positioning. Popup composition/focus management is bounded, not the
full upstream floating tree. NumberField omits scrubbing, hold-repeat and full
Field validation. Small controls have mount-time defaults, not a universal
server-controlled state API. Physical IME, assistive technology and physical
mobile devices are not certified by these browser checks.

The goal is useful everyday behavior with clear limits. Passing tests for one
slice must never be presented as full Base UI parity.

Recommended first application integrations: [adoption targets](docs/adoption.md).
Experiment assessment: [viability verdict](docs/viability-verdict.md).
Latest API integration: [forms and packaging](docs/runs/2026-09-08-forms-and-composition.md).
Original port results: [Chromium gate](docs/runs/2026-09-07-final-integration.md).
