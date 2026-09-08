defmodule Lab.FormsLive do
  use Phoenix.LiveView
  alias Sheaf.Components
  alias Sheaf.Controls
  alias Sheaf.Combobox

  @defaults %{"vn_id" => "hotel-dusk", "status" => "reading", "quantity" => "1"}
  @novels [
    %{value: "hotel-dusk", label: "Hotel Dusk", producer: "Cing"},
    %{value: "clannad", label: "Clannad", producer: "Key"},
    %{value: "umineko", label: "Umineko", producer: "07th Expansion"}
  ]

  def mount(_, _, socket) do
    {:ok,
     assign(socket,
       form: to_form(@defaults, as: :entry),
       novels: @novels,
       saved: nil,
       saves: 0,
       changes: 0,
       action: ""
     )}
  end

  def render(assigns) do
    ~H"""
    <main class="lab-demo lab-form-demo">
      <h1>A normal Phoenix form</h1>
      <p>Custom option content, server validation and ordinary form submission. No selection acknowledgement handlers.</p>
      <.form for={@form} id="entry-form" class="lab-entry-form" phx-change="validate" phx-submit="save">
        <Combobox.combobox field={@form[:vn_id]} label="Visual novel" options={@novels}>
          <:item :let={novel}>
            <span aria-hidden="true">▧</span>
            <strong>{novel.label}</strong>
            <small> — {novel.producer}</small>
          </:item>
        </Combobox.combobox>
        <Components.select field={@form[:status]} label="Status"
          options={[%{value: "reading", label: "Reading"}, %{value: "read", label: "Read"}, %{value: "wishlist", label: "Wishlist"}]}>
          <:item :let={option}><strong>{option.label}</strong><span aria-hidden="true"> →</span></:item>
        </Components.select>
        <Controls.number_field field={@form[:quantity]} label="Quantity" min={0} max={100} step={0.5} />
        <button type="submit">Save entry</button>
        <button type="reset">Reset browser fields</button>
      </.form>
      <button type="button" phx-click="reset">Restore initial entry</button>
      <button type="button" phx-click="load">Load another entry</button>
      <Components.menu id="entry-actions" label="Entry actions"
        options={[%{value: "archive", label: "Archive"}, %{value: "duplicate", label: "Duplicate"}]}>
        <:trigger>Entry actions</:trigger>
        <:item :let={option}>
          <span aria-hidden="true">↗</span><strong>{option.label}</strong>
          <small> — this entry</small>
        </:item>
      </Components.menu>
      <p>Saved value: <output data-testid="form-saved">{if @saved, do: Jason.encode!(@saved), else: ""}</output></p>
      <p>Saves: <output data-testid="form-saves">{@saves}</output></p>
      <p>Validated changes: <output data-testid="form-changes">{@changes}</output></p>
      <p>Last action: <output data-testid="form-action">{@action}</output></p>
      <.link navigate="/lab">Back to Sheaf</.link>
    </main>
    """
  end

  def handle_event("validate", %{"entry" => params}, socket) do
    {:noreply, assign(socket, form: validated_form(params), changes: socket.assigns.changes + 1)}
  end

  def handle_event("save", %{"entry" => params}, socket) do
    next_form = validated_form(params)
    socket = assign(socket, form: next_form)

    socket =
      if next_form.errors == [],
        do:
          assign(socket,
            saved: Map.take(params, ["vn_id", "status", "quantity"]),
            saves: socket.assigns.saves + 1
          ),
        else: socket

    {:noreply, socket}
  end

  def handle_event("reset", _, socket),
    do: {:noreply, assign(socket, form: to_form(@defaults, as: :entry))}

  def handle_event("load", _, socket),
    do:
      {:noreply,
       assign(socket,
         form: to_form(%{"vn_id" => "umineko", "status" => "read", "quantity" => "3"}, as: :entry)
       )}

  def handle_event("menu_action", %{"component_id" => "entry-actions", "value" => value}, socket)
      when value in ["archive", "duplicate"],
      do: {:noreply, assign(socket, action: value)}

  defp validated_form(params) do
    errors =
      if params["quantity"] in ["0", "0.0", ""],
        do: [quantity: {"must be greater than zero", []}],
        else: []

    errors =
      if Enum.any?(@novels, &(&1.value == params["vn_id"])),
        do: errors,
        else: [{:vn_id, {"choose a visual novel", []}} | errors]

    errors =
      if params["status"] in ["reading", "read", "wishlist"],
        do: errors,
        else: [{:status, {"choose a status", []}} | errors]

    to_form(params, as: :entry, errors: errors)
  end
end
