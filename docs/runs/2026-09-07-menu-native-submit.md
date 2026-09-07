# Native Menu submit buttons

Four shared Chromium cases passed 8/8 target executions against actual Base UI
Menu.Item rendered as a native submit button: Enter, Space, pointer activation,
and disabled activation guard. Each enabled case submits exactly once with the
button's name/action value archive and closes the menu. Disabled activation
preserves the open menu and zero submit count. The form lives inside the popup,
so browser form ownership is the same in both fixtures.

The existing 16-case Menu suite then passed 32/32 target executions in Chromium,
covering the previous callback-action contract after native action support was
added. Reports: `artifacts/menu-form-paired-chromium.json` and
`artifacts/menu-native-regression-chromium.json`. Arbitrary link navigation and
forms outside portal ownership were not added to this bounded gate.
