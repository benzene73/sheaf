# Headless LiveView components

`Sheaf.Components` supplies structural markup for the completed bounded hooks. Import it into the application's HTML helpers, and register `PortedDialog`, `NativeMenu`, `NativeSelect` and `NativePositionedPopover` with LiveSocket. The component names are `dialog`, `menu`, `select` and `popover`. Alias the module instead if these names conflict with existing helpers.

Every instance needs a unique, stable `id`. Child IDs and ARIA relationships derive from it. Classes style the root, trigger and popup; Menu/Select also expose `item_class`. Structural inline styles keep the native top layer and viewport bounds working, without supplying colors, typography or a theme. Avoid overriding those structural properties. Use caller CSS (including native dialog ::backdrop rules) for appearance.

Other reusable helpers: [number fields, tabs, accordion, tooltip and toggle groups](controls.md)
use `Sheaf.Controls`. The [Combobox helper](combobox-component.md)
has a separate server acceptance protocol. These APIs deliberately document
their different state-ownership contracts rather than pretending every control
supports the same server-controlled value API.

## Dialog

```heex
<.dialog id="edit-profile" label="Edit profile" popup_class="profile-dialog">
  <:trigger>Edit profile</:trigger>
  <.form for={@form} id="profile-form" phx-submit="save_profile">
    <!-- Your inputs and Save button belong here. -->
    <button type="submit">Save</button>
  </.form>
</.dialog>
```

A Close button is included; customize `close_label` and `close_class`. `cancel_close` and `disable_pointer_dismissal` configure synchronous dismissal policy. Open state is browser-owned, initially closed, and protected from unrelated LiveView patches. `dialog_request` sends `%{"component_id" => id, "open" => boolean, "canceled" => boolean}`. Saving does not automatically close. There is no server-controlled open assign, asynchronous approval protocol, animation or nonmodal variant. External native close/method=dialog bypasses the request policy.

## Menu

```heex
<.menu id="review-actions" label="Review actions"
  options={[%{value: "edit", label: "Edit"}, %{value: "delete", label: "Delete", disabled: true}]}>
  <:trigger>Actions</:trigger>
</.menu>
```

Options are maps with unique string `value`, string `label`, and optional boolean `disabled`. Actions emit `menu_action` with `%{"component_id" => id, "value" => value}`. Validate the ID/action and authorization in the host. `keep_open` defaults false; `modal` defaults true and means the existing pointer/scroll policy, not a new accessibility-isolation guarantee. This API exposes action rows, not navigation links or nested menus.

### Native form actions

```heex
<.menu id="archive-menu" label="Actions">
  <:trigger>Actions</:trigger>
  <:native_actions>
    <.form for={@form} id="archive-form" phx-submit="archive">
      <.menu_submit name="action" value="archive">Archive</.menu_submit>
    </.form>
  </:native_actions>
</.menu>
```

The optional native_actions slot owns the form; menu_submit supplies a real submit button with native menu-item semantics. Native actions close the menu without also emitting menu_action, preserving the submitter name/value and form attributes. Disabled items remain focusable but cannot submit. This bounded API supports form buttons, not arbitrary navigation-link rendering. Do not nest a form inside another form; use the button's form attribute when associating with an existing form outside the popup.

## Select

```heex
<.select field={@form[:country]} label="Country"
  options={[%{value: "GB", label: "United Kingdom"}, %{value: "IN", label: "India"}]}>
  <:item :let={option}>
    <span aria-hidden="true">🌍</span> {option.label}
  </:item>
  <:trigger><span aria-hidden="true">⌄</span></:trigger>
</.select>
```

In default `mode="form"`, this works inside ordinary `.form phx-change/phx-submit` handlers: accepted selections update a named hidden input and emit bubbling input/change events. No select_value handler is required. Native form reset restores the latest server-rendered value without fabricating another change event. Server value changes reconcile the selection; unrelated patches preserve a local selection that has not yet been acknowledged.

`field` derives id, name, value and used-input errors. Explicit id/name/value overrides win, including an explicit nil. Without a field, supply a stable id and name/value directly. Errors can be overridden with `errors`, translated with `translate_error`, styled with `error_class`, and are linked through aria-invalid/aria-describedby; `described_by` preserves an additional external description.

The optional item slot customizes content inside each canonical option; its `:let` receives the option map. Option label remains the semantic accessible/typeahead/selected label even when extra decoration or text is rendered. The trigger slot adds decoration after the owned selected-label span. Values and labels may differ.

For existing observer integrations, opt into `mode="observer"`: select_value emits component_id, value and canceled, and the host updates the accepted value assign. Raw legacy hook markup without data-mode retains that behavior. `disabled`, `read_only`, synchronous `cancel_value`, and `modal` retain their existing meanings. This is single selection, without asynchronous approval or item-aligned positioning.

Menu also accepts `<:item :let={option}>` with the same semantic-label/content separation. Its existing options, native form-action slot and event contract are unchanged.

## Popover

```heex
<.popover id="reading-help" label="Reading status help" popup_class="help-popup">
  <:trigger>What does this mean?</:trigger>
  <p>Use Reading for works you have started.</p>
  <button type="button" phx-click="learn_more">Learn more</button>
</.popover>
```

Inner content and actions belong to the caller. `modal` defaults false; its optional true value is the bounded pointer/scroll policy, not a complete modal focus-manager promise. The existing hook owns native top-layer lifecycle, positioning and bounded focus behavior. There is no server open-state API or complete nested-popup/focus-out dismissal implementation.

These helpers centralize the existing hook contracts; they do not expand behavioral parity beyond the recorded browser gates. Keep option values unique and stable, keep required data parts intact, and validate all server events normally.
