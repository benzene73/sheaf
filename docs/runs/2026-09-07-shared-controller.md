# Shared native popup controller regression

After replacing separate menu/positioning lifecycle wiring with the shared native
popup controller, the unchanged paired suites passed on Chromium, Firefox and
WebKit: menu **96/96**, geometry **30/30**, scroll behavior **12/12**.

These are regression results for the same bounded contracts, not additional
component coverage. Raw artifacts are `artifacts/menu-shared-controller.json`,
`artifacts/positioning-shared-controller.json`, and
`artifacts/scroll-shared-controller.json`.
