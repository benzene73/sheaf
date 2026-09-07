defmodule Lab.MenuFormLive do
  use Phoenix.LiveView
  import LiveViewPrimitives.Components

  def mount(_, _, socket), do: {:ok, assign(socket, submitted: "", submits: 0)}

  def render(assigns) do
    ~H"""
    <main>
      <.menu id="menu-form-fixture" label="Actions">
        <:trigger>Actions</:trigger>
        <:native_actions>
          <form id="archive-form" phx-submit="archive">
            <.menu_submit name="action" value="archive">Archive</.menu_submit>
            <.menu_submit name="action" value="delete" disabled>Delete</.menu_submit>
          </form>
        </:native_actions>
      </.menu>
      <output data-testid="submitted-action">{@submitted}</output>
      <output data-testid="submit-count">{@submits}</output>
      <button type="button">Outside</button>
    </main>
    """
  end

  def handle_event("archive", %{"action" => action}, socket),
    do: {:noreply, assign(socket, submitted: action, submits: socket.assigns.submits + 1)}
end
