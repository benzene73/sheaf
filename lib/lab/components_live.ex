defmodule Lab.ComponentsLive do
  use Phoenix.LiveView
  import LiveViewPrimitives.Components

  def mount(_, _, socket), do: {:ok, assign(socket, country: "GB", action: "", saved: "")}

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <h1>Public component API</h1>
      <.select id="country" label="Country" name="country" value={@country}
        options={[%{value: "GB", label: "United Kingdom"}, %{value: "IN", label: "India"}]}>
        <:trigger><span data-testid="country-chevron" aria-hidden="true">⌄</span></:trigger>
      </.select>
      <output data-testid="country-value">{@country}</output>
      <.menu id="actions" label="Actions"
        options={[%{value: "edit", label: "Edit"}, %{value: "archive", label: "Archive"}]}>
        <:trigger>Actions</:trigger>
      </.menu>
      <output data-testid="action-value">{@action}</output>
      <.dialog id="profile" label="Edit profile">
        <:trigger>Edit profile</:trigger>
        <.form for={%{}} id="profile-form" phx-submit="save">
          <label for="profile-name">Name</label>
          <input id="profile-name" name="name" />
          <button type="submit">Save</button>
        </.form>
      </.dialog>
      <output data-testid="saved-name">{@saved}</output>
      <.popover id="help" label="Reading help">
        <:trigger>Reading help</:trigger>
        <p>Use Reading for works you have started.</p>
        <button type="button">Got it</button>
      </.popover>
    </main>
    """
  end

  def handle_event(
        "select_value",
        %{"component_id" => "country", "value" => value, "canceled" => false},
        socket
      )
      when value in ["GB", "IN"], do: {:noreply, assign(socket, country: value)}

  def handle_event("menu_action", %{"component_id" => "actions", "value" => value}, socket)
      when value in ["edit", "archive"], do: {:noreply, assign(socket, action: value)}

  def handle_event("dialog_request", %{"component_id" => "profile"}, socket),
    do: {:noreply, socket}

  def handle_event("save", %{"name" => name}, socket), do: {:noreply, assign(socket, saved: name)}
end
