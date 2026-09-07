# ToggleGroup slice

Pinned Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`, MIT attribution retained. `toggle-group.ts` extracts ToggleGroup.tsx setGroupValue and Toggle.tsx click: child pressed callback precedes group callback, both share cancellation details, and cancellation prevents remaining assignments. Single mode defaults to false for `multiple`, supports zero or one selection, and pressing the active item clears it. Multiple mode copies/adds/removes the ordered values array. Default group selection is empty; the fixture explicitly supplies grid.

Standalone groups use CompositeRoot horizontal orientation, looping and Home/End. Toggles are native disabled buttons (not focusableWhenDisabled). The adapter reuses the already extracted button-only Composite navigation from Tabs: its [] disabled-index policy has identical results for these native-disabled-only fixture items; no aria-disabled-only items or toolbar nesting are claimed. Native button Enter/Space and disabled behavior are retained. This is not a radio group and intentionally permits clearing all items. It does not participate in native form validation; LiveView receives the value array.

`Lab.ToggleGroupLive` and `PortedToggleGroup` are the bounded fixture/adapter, with query multiple=true, Grid/List/Disabled, aria-pressed, roving tabindex and server output. Group state patches restore browser roving focus state. Dynamic item removal/reordering, toolbar nesting, uncontrolled child-only defaults, non-native render targets and generic shared component APIs are not included.

Two focused unit tests cover single/multiple updates and cancellation ordering. The independent Chromium harness covers ordinary click/keyboard workflows.
