# Combobox component and form contract

Import `Sheaf.Combobox` and register the `PortedCombobox` hook. The public helper defaults to `mode="form"`: selection updates immediately and the named hidden input emits bubbling native `input` and `change` events. Use normal Phoenix `phx-change`/`phx-submit` forms; no mount, intent or select event handlers are required. The search text is an unnamed draft; submitted values are option IDs, never arbitrary typed text.

```heex
<.form for={@form} phx-change="validate" phx-submit="save">
  <.combobox field={@form[:country]} label="Country"
    options={[%{value: "gb", label: "United Kingdom"}, %{value: "jp", label: "Japan"}]}
    placeholder="Search countries" />
</.form>
```

`field` derives `id`, `name`, `value` and errors. Explicit `id`, `name` and `value` attributes override the field, including an explicit nil value. Without a field, supply a stable unique `id`, optional `name` and `value`. Field errors show only after `Phoenix.Component.used_input?/1`; explicit `errors` override that behavior. `translate_error` accepts a one-argument function for application Gettext integration. Without it, tuple errors use basic `%{key}` interpolation. Errors are linked through `aria-describedby` and `aria-invalid`; `described_by` can additionally link help text.

The browser owns open state, highlight, composition and draft text. Changed server values replace selection and draft after a patch. An acknowledgement echoing the current local selection preserves a newer search draft or IME session. Unrelated patches preserve local selection and draft; option-label changes refresh closed selection text. A native form reset restores the latest server-rendered value, clears draft/open state and emits no synthetic change. A server patch rendering the same value as its previous assign does not signal an explicit reset; use the native form reset when that distinction matters.

Values must be unique nonempty strings. Labels default to values. `accepted_label` retains a label when the selected option is absent from the rendered options. `disabled` disables both inputs; `read_only` permits navigation but prevents selection. `loop` defaults true. The `cancel_input` and `cancel_close` flags are synchronous callback policies.

## Custom option content

```heex
<.combobox field={@form[:novel_id]} label="Visual novel" options={@novels}>
  <:item :let={novel}>
    <img src={novel.cover_url} alt="" />
    <span>{novel.label}</span>
    <small>{novel.subtitle}</small>
  </:item>
</.combobox>
```

The item slot receives the original option map with its normalized label. Search and the accepted text use `label`, while submission uses `value`; extra visible text does not change either. Classes are available for root, label, input, popup, items and errors. The popup uses a manual native popover with the shared anchor-positioning policy, matches input width, stays within viewport bounds and scrolls internally. Input retains focus.

## Optional asynchronous selection approval

Set `mode="async"` only when the host must approve each selection before committing it. This preserves the guarded acceptance bridge and requires all three host events:

- `combobox_mount`: register `component_id` and a fresh 128-bit `instance` token for the rendered component.
- `intent`: invalidate pending proposals with that component, instance and `generation`.
- `select`: validate `value` (string or null), `request_id` and `generation` against allowed options and permissions. Recheck lifetime, latest request and generation before delayed acceptance.

Complete by updating the accepted assign and pushing `selection_result` with `component_id`, `instance`, `request_id`, `generation`, `accepted`, `obsolete`, and canonical `value`. Echo correlation fields exactly. Obsolete work must not commit server state; rejection retains the previous value. Maintain state per whitelisted rendered component and replace the lifetime on remount. Browser stale-reply guards do not replace server-side authorization. Async mode's hidden field follows server patches and does not emit form-mode selection events.

Filtering is local in both modes. Asynchronous selection approval is independent of remote search; this helper does not send search requests, debounce a search service or implement a remote result cache. Raw historical markup without `data-mode` retains the original asynchronous bridge for compatibility; public helpers always render their explicit mode. The same hook and source-translated behavior modules serve both modes.
