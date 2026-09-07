# Distinct Combobox labels and canonical IDs

Pinned Base UI AriaCombobox.tsx defines stringifyValueLabel through stringifyAsLabel/itemToStringLabel (:239), derives selectedLabelString (:341), fills the input after selection (:849), and restores the selected label on close (:962). The existing extracted requestSingleSelectedValue and completeSingleClose already expose these label callbacks. No source behavior function needed changing.

The LiveView host now implements valueLabel(value) using the option's data-label (or text for legacy string rows). It supplies that callback at selection completion and uses the same label for initial text, close completion and resolveComboboxFilterQuery. Input filtering searches labels; equality, request correlation and hidden form values remain string IDs. The headless helper emits data-label and data-accepted-label. When no selected row is rendered, accepted_label is a host-provided fallback; absent that, the original string-as-label behavior remains.

This is a host adapter for string IDs, not an implementation of React object identity, arbitrary comparators, remote fetching or async search. The existing component/instance/request/generation protocol is unchanged. Lab.LabelComboboxLive uses the same whitelisted single-component acceptance contract with gb/in IDs and United Kingdom/India labels.

Shared browser oracle uses actual Base UI object items with itemToStringLabel/itemToStringValue and compares user-visible labels plus submitted canonical values. These integration cases are separate from broader object/collection parity claims.

## Public popup positioning

The public helper's list uses native popover=manual, with browser top-layer placement as an explicit host adaptation. The hook opts in only when that attribute is present and reuses startAnchorPositioning's already-mapped source geometry; it does not introduce another collision algorithm. Input focus, existing Escape/outside/cancellation policies and proposal correlation remain unchanged. There is no modal scroll lease. Positioner lifetime follows open/close/destroy; filtered-content changes request an update. Legacy inline fixtures remain unchanged. Native top-layer ancestry applies when rendered inside a native dialog.
