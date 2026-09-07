# Headless LiveView components

`LiveViewPrimitives.Components` supplies structural markup for the completed bounded hooks. Import it into the application's HTML helpers, and register `PortedDialog`, `NativeMenu`, `NativeSelect` and `NativePositionedPopover` with LiveSocket. The component names are `dialog`, `menu`, `select` and `popover`. Alias the module instead if these names conflict with existing helpers.

Every instance needs a unique, stable `id`. Child IDs and ARIA relationships derive from it. Classes style the root, trigger and popup; Menu/Select also expose `item_class`. Structural inline styles keep the native top layer and viewport bounds working, without supplying colors, typography or a theme. Avoid overriding those structural properties. Use caller CSS (including native dialog ::backdrop rules) for appearance.

Other reusable helpers: [number fields, tabs, accordion, tooltip and toggle groups](controls.md)
use `LiveViewPrimitives.Controls`. The [Combobox helper](combobox-component.md)
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

## Select

```heex
<.select id="country" label="Country" name="profile[country]" value={@country}
  options={[%{value: "GB", label: "United Kingdom"}, %{value: "IN", label: "India"}]}
  placeholder="Choose country">
  <:trigger><span aria-hidden="true">⌄</span></:trigger>
</.select>
```

The selected-label span is owned by the component. The optional trigger slot adds decoration without replacing it. IDs and labels may differ. `select_value` sends `%{"component_id" => id, "value" => value, "canceled" => boolean}`. Validate the chosen option, then update the corresponding `value` assign for accepted changes. If `cancel_value` is true, retain the old assign. The hook provides immediate local feedback and reconciles that accepted assign on patches; it is not asynchronous validation with rollback.

`name` optionally supplies the hidden form field. It reflects the server accepted assign, so update that assign promptly rather than treating the notification as logging only. `disabled` disables the trigger and form field; `read_only` permits browsing but rejects changes. The optional `modal` flag defaults true. No multiple selection, arbitrary item renderer or default item-aligned positioning is exposed.

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
