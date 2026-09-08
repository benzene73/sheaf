# Browser-owned controls

Alias `Sheaf.Controls` and register the exported hook collection.
These helpers centralize structural markup, labels, IDs and ARIA. Supply classes
for appearance. Unique string item values and a stable root ID are required.

Tabs and Accordion retain browser-owned default values and observer notifications.
NumberField instead supports ordinary Phoenix form fields by default.

## Number field

```heex
<Controls.number_field field={@form[:quantity]} label="Quantity"
  min={0} max={1000} step={0.5} />
```

`mode="form"` is the default. A field derives id/name/value and used-input errors; explicit id/name/value overrides take precedence. Without a field, supply id/name/value (`default_value` remains a fallback for existing callers). Standard `.form phx-change/phx-submit` receives the canonical number through the hidden named input. The control emits input when that number changes and change on commit; no number_change/number_commit handlers are required. Intermediate numeric text remains local.

Native reset restores the latest server-rendered baseline without an extra change event. Updated server values reconcile the control, while an acknowledgement of the current number preserves a draft such as a trailing decimal. Unrelated patches do not erase browser state. Errors support `errors`, `translate_error`, `error_class`, and external `described_by`; the visible input receives linked error IDs and aria-invalid.

`mode="observer"` retains number_change/number_commit notifications with component_id and value. Raw hook fixtures without data-mode retain observer behavior. Parsing, formatting, bounds, fractional steps, locale/format, disabled/read_only and part classes remain supported. No hold-repeat, scrub or wheel control is exposed. JavaScript numeric state is not an exact accounting Decimal contract; applications still validate their submitted values.

## Tabs

```heex
<Controls.tabs id="profile-sections" label="Profile sections" default_value="about">
  <:item value="about" label="About">About content</:item>
  <:item value="activity" label="Activity">Activity content</:item>
</Controls.tabs>
```

Arrows/Home/End move focus. Enter/Space activates by default; set
`activate_on_focus` for automatic activation. `orientation` accepts horizontal or
vertical. Disabled items remain discoverable by focus but cannot activate,
matching the pinned source. `tabs_change` includes `component_id` and `value`.
Panels remain mounted and hidden when inactive. `tab_class` and `panel_class`
style parts. Do not substitute this for navigation links to another page.

## Accordion

```heex
<Controls.accordion id="questions">
  <:item value="import" label="Can I import my library?">Import instructions.</:item>
  <:item value="export" label="Can I export it?">Export instructions.</:item>
</Controls.accordion>
```

One section opens at a time; `multiple` allows several. `default_value` is a list,
empty by default. Native buttons supply Enter/Space activation and normal Tab
order. `accordion_change` includes `component_id` and `value` (string array).
`disabled` disables the group; individual slots can also be disabled. Panels stay
mounted. No transition sizing or hidden-until-found behavior is exposed.

## Tooltip

```heex
<Controls.tooltip id="rating-help">
  <:trigger>Rating help</:trigger>
  Rate according to your own enjoyment.
</Controls.tooltip>
```

Keyboard focus opens immediately; hover uses a 600ms rest delay by default.
`delay={0}` makes hover immediate, as in the shared fixture. Blur, leaving and
Escape dismiss. The popup is noninteractive and non-hoverable; use Popover for
links or buttons. `trigger_class` and `popup_class` style it. The hook supplies
`aria-describedby` while open without deleting existing descriptions. This
relationship and `role=tooltip` intentionally improve the pinned implementation's
observed omission. No provider grouping or hover-safe polygon is exposed.

## Toggle group

```heex
<Controls.toggle_group id="view-mode" label="View" default_value={["grid"]}
  options={[%{value: "grid", label: "Grid"}, %{value: "list", label: "List"}]} />
```

Arrows move among enabled native buttons; Enter/Space toggles the focused one.
Pressing the current selection can clear it. This is deliberately not a radio
group requiring one selection. `multiple` permits several pressed values;
`toggle_change` includes `component_id` and `values`. No hidden form field is
added. `orientation` supports horizontal/vertical and `button_class` styles items.

Dynamic removal of selected tabs/toggles, server-controlled resets, toolbar
nesting and full upstream compositional APIs remain outside the current contract.
