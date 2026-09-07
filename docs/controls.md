# Browser-owned controls

Alias `Sheaf.Controls` and register the exported hook collection.
These helpers centralize structural markup, labels, IDs and ARIA. Supply classes
for appearance. Unique string item values and a stable root ID are required.

`default_value` is read at mount. LiveView notifications let the application
observe changes, but later patches do not reset client state. These helpers do
not claim server-controlled values, asynchronous approval or form-validation
integration. Remount deliberately when a complete reset is intended.

## Number field

```heex
<Controls.number_field id="quantity" label="Quantity" name="line[quantity]"
  default_value={1} min={0} max={1000} step={0.5} />
```

`number_change` and `number_commit` include `component_id` and `value` (number or
null). The hidden form input holds the browser's canonical numeric value; raw
uncommitted text stays in the visible input. Parsing, formatting, bounds and
fractional steps are implemented. `locale`, `format`, `disabled`, `read_only`,
`input_class` and `button_class` are supported. No hold-repeat, scrubbing or wheel
control is exposed. JavaScript numbers are not an accounting Decimal contract:
applications must preserve their own exact monetary parsing and validation.

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
