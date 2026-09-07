# LiveView selection boundary

This is a LiveView integration contract, not a translation of React Context or
an upstream networking protocol. Source value and cancellation policies run on
either side of this boundary as documented in the combobox mapping.

Each mounted combobox has a unique DOM `component_id` and a random 128-bit
`instance` token. It registers that pair with `combobox_mount` before sending
`intent` or `select`. LiveView's ordered socket transport preserves that order.
The host must whitelist rendered components and keep request, intent and
validation state separately for each component and its current instance.

Selection requests and replies carry both identities, a request ID and an intent
generation. A newer edit/dismissal invalidates an outstanding continuation. A
reply for another component or a previous mount is ignored before touching any
pending state. Server validation must check the same ownership before applying
the canonical value; filtering only the browser callback is insufficient.

The single-component `/paired` fixture demonstrates these checks. Removing the
component invalidates its registered instance on the server. Its explicit test
remount starts with an empty value; a real application's persistence policy may
instead preserve the previously accepted value. The generic hook does not decide
that policy. A host rendering several components needs a per-component state map
or separate LiveComponents, rather than copying this fixture's single state slot.

Server patches reconcile accepted values independently of pending continuations.
An obsolete validation result cannot overwrite a newer query or reopen a popup.
Stable input/list part identities are required; option children may be replaced,
removed or patched, and active descendants are revalidated after each patch.

Ordinary reconnect behavior beyond LiveView's remount lifecycle, distributed
validation jobs and delivery across a new socket session remain outside this
bounded contract. Select's current fixture uses synchronous server-provided
cancellation policy and does not yet use this asynchronous combobox protocol.
