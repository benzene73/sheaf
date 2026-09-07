# Accordion and ToggleGroup everyday gates

Accordion passed 8/8 paired Chromium executions: click toggle, Enter/Space,
single-open replacement, and disabled activation guard. Initial LiveView disabled
failure identified HEEx boolean serialization producing an empty aria-disabled
attribute; string serialization fixed it before the passing rerun. Upstream's
disabled trigger remains focusable (disabled property false, aria-disabled true).
The driver checks accessible disabled state and guards activation, not native
disabled property. Panel region names and ARIA linkage are checked on expansion.

ToggleGroup passed 8/8 paired Chromium executions: single selection and clearing,
arrow navigation with Space activation, disabled guard, and multiple selection.
The fixture starts Grid pressed with Grid/List/Disabled buttons. Unlike Accordion
and Tabs, this disabled toggle is skipped by arrow navigation. No cancellation,
dynamic removal, vertical orientation or RTL coverage is claimed here.

After Controls function component extraction, the existing Tabs six-case suite
also passed 12/12 in Chromium. Raw reports are
`artifacts/accordion-paired-chromium.json`,
`artifacts/toggle-group-paired-chromium.json`, and
`artifacts/tabs-controls-chromium.json`.
