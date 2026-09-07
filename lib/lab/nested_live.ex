defmodule Lab.NestedLive do
  use Phoenix.LiveView
  alias LiveViewPrimitives.Components, as: Controls

  def mount(_, _, socket), do: {:ok, assign(socket, country: "GB", saved: "", saves: 0)}

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <Controls.dialog id="nested-profile" label="Edit profile">
        <:trigger>Edit profile</:trigger>
        <.form for={%{}} id="nested-profile-form" phx-submit="save">
          <Controls.select id="nested-country" label="Country" name="country" value={@country}
            options={[%{value: "GB", label: "United Kingdom"}, %{value: "IN", label: "India"}]} />
          <button type="submit">Save</button>
        </.form>
      </Controls.dialog>
      <output data-testid="nested-country-value">{@country}</output>
      <output data-testid="nested-saved-value">{@saved}</output>
      <output data-testid="nested-saves">{@saves}</output>
    </main>
    """
  end

  def handle_event(
        "select_value",
        %{"component_id" => "nested-country", "value" => value, "canceled" => false},
        socket
      )
      when value in ["GB", "IN"], do: {:noreply, assign(socket, country: value)}

  def handle_event("dialog_request", %{"component_id" => "nested-profile"}, socket),
    do: {:noreply, socket}

  def handle_event("save", %{"country" => country}, socket),
    do: {:noreply, assign(socket, saved: country, saves: socket.assigns.saves + 1)}
end
