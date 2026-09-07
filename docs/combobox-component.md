# Combobox component and host contract

Import `Sheaf.Combobox` and register the JavaScript `PortedCombobox` hook. This helper centralizes the existing input/list/ARIA/ID contract; it does not add a selection server or remote search. Filtering runs locally over the supplied options. The public helper uses a manual native popover and the existing shared anchor-positioning policy. The popup matches input width, stays within available viewport bounds and scrolls internally; `popup_class` supplies visual styling. Input retains focus. It adds no backdrop, scroll lock or separate dismissal policy. Legacy consumers without popover="manual" retain their inline layout.

```heex
<.combobox id="favorite-fruit" label="Favorite fruit" name="profile[fruit]"
  value={@accepted_fruit}
  options={[%{value: "Apple"}, %{value: "Banana", disabled: true}, %{value: "Cherry"}]}
  placeholder="Search fruit" input_class="fruit-input" popup_class="fruit-options" />
```

Values must be unique nonempty strings; labels are separate strings and default to the value when omitted. For example `%{value: "gb", label: "United Kingdom"}` renders and searches United Kingdom while submitting gb. The hook resolves labels through the source's existing stringifyValueLabel callback for accepted selection, initial text, close restoration and selected-label filtering. The hidden field and selection protocol retain the canonical ID.

If the selected option is not rendered, supply `accepted_label` alongside `value` to retain its display label. This is an explicit host fallback, not remote search or arbitrary object serialization. Existing string-only options continue to work.

The root ID is stable and unique; option IDs derive from encoded values. `value` is the server accepted value. The browser separately owns open state, active option, text draft and composition text. The input value attribute is protected during patches; the optional hidden form field reflects the accepted server assign, never an unaccepted typed query. `read_only` permits navigation but prevents changing value. `disabled` disables input and form field. `loop` defaults true. `cancel_input` and `cancel_close` are synchronous callback policies, not asynchronous server authorization.

## Required LiveView integration

The hook sends these existing events:

- `combobox_mount`: component_id and a fresh 128-bit instance token. Register the lifetime for a known rendered component.
- `intent`: component_id, instance and generation. Invalidate pending proposals for that same lifetime; never invalidate another field.
- `select`: component_id, instance, value (string or null), request_id and generation. Validate against that component's allowed options and permissions. Before delayed acceptance, recheck lifetime, latest request and generation.

Complete a proposal by updating the accepted assign and pushing `selection_result` with component_id, instance, request_id, generation, accepted (boolean), obsolete (boolean), and value (the canonical accepted string or null). Echo correlation fields exactly. Obsolete work must not commit server state. Rejected work retains the previous accepted value. A component/instance token identifies work; it grants no authorization.

Use a server state entry per rendered component, containing its current instance, latest request, generation and accepted value. Whitelist rendered IDs rather than allocating arbitrary client-supplied keys. On remount the fresh instance replaces the old lifetime; callbacks from the old lifetime must be ignored. The hook rejects foreign/stale replies, but that does not replace server-side guards. `Lab.PairedLive` demonstrates the protocol for one whitelisted component; its literal fixture ID must not be copied as a general multi-field router.

There is deliberately no new event naming scheme, server-search request, automatic form submit, or async filtering cache. Use the existing protocol and its recorded isolation tests. This helper provides markup, not a turnkey server callback module. The browser waits for acceptance before completing selection; applications must implement all three events and return the result rather than treating them as optional analytics.
