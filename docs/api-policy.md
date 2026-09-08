# Sheaf consumer API policy

Sheaf is the headless library. Application components supply styling and business
meaning. The demo is a separate Phoenix application consuming Sheaf through a
local path dependency; it is not started by installing the library.

## Forms

Combobox, Select and NumberField accept `field={@form[:field]}`. A shared
`Sheaf.FormField` adapter derives ID, name, value and used-input errors. Explicit
attributes override derived values, including explicit nil. Applications can
provide error translation; Sheaf does not require an application Gettext backend.

The default `mode="form"` uses native backing controls and bubbling form events.
Applications use normal `phx-change` and `phx-submit` handlers. They do not need
component-specific event handlers just to select a value. A server render can
replace a value; unrelated patches preserve transient user interaction. Native
form reset restores the latest rendered baseline, not an application record's
original persisted value. To restore that record, render the desired form again.

Combobox `mode="async"` explicitly enables guarded selection approval. Its
instance/request/intent correlation belongs to that mode, not ordinary forms.
Remote option lookup and selection approval are separate operations. Select and
NumberField `mode="observer"` retain the earlier component-event workflows for
callers that deliberately want them. Raw historical fixtures retain their
original contracts; the reusable components render their mode explicitly.

This is not a universal controlled/uncontrolled API for every Sheaf family.
Tabs, Accordion and ToggleGroup still expose their documented mount-time defaults.
Exact accounting values still belong to the application's Decimal/string boundary.

## Composition

Combobox, Select and Menu expose an optional `:item` slot receiving the option
map. The helper still renders the single canonical option/menu-item structure,
stable IDs and semantic state. The slot supplies content such as a title,
producer or icon. `label` remains the searchable/announced label independently
of decorative content. Avoid interactive descendants inside an option.

Keep ordinary use concise. Do not add a root/trigger/content/item public API
merely to resemble a React library. Add independently composable parts when an
actual application layout needs them, with explicit relationships and one shared
structural implementation. Native menu submission uses `menu_submit`, preserving
form ownership and submitter attributes.

## References and boundaries

- Base UI remains the source for mapped behavioral contracts and algorithms.
- Phoenix FormField/used_input conventions, also used by Petal and PUI, inform
  field normalization and native form integration.
- PUI's ownership documentation supports keeping application decisions outside
  browser interaction code; its module names are not a mandatory template.
- Custom item slots use Phoenix composition rather than a simulated React
  context. No theme package, code generator or installer is introduced.

Review the normal selection, validation, save, reset and patch paths when adopting
a control. Preserve application styling and remove replaced interaction code only
after a real consumer works. No Kaguya or Nila production integration is included
in this library/API phase.
