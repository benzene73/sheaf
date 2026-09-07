defmodule Lab.DialogLive do
  use Phoenix.LiveView

  def mount(params, _, socket) do
    {:ok,
     assign(socket,
       cancel_close: params["cancelClose"] == "true",
       disable_pointer: params["disablePointerDismissal"] == "true",
       saved: "",
       saves: 0,
       outside_clicks: 0,
       close_requests: 0
     )}
  end

  def render(assigns) do
    ~H"""
    <main id="dialog-fixture" phx-hook="PortedDialog" data-cancel-close={to_string(@cancel_close)}
      data-disable-pointer-dismissal={to_string(@disable_pointer)}>
      <button id="dialog-trigger" data-part="trigger" data-testid="dialog-trigger" type="button"
        aria-haspopup="dialog" aria-expanded="false" aria-controls="native-dialog">Open dialog</button>
      <dialog id="native-dialog" data-part="dialog" aria-label="Dialog fixture"
        phx-mounted={Phoenix.LiveView.JS.ignore_attributes(["open"])}>
        <form id="dialog-form" phx-submit="save">
          <label for="dialog-name">Name</label>
          <input id="dialog-name" name="name" />
          <button type="submit">Save</button>
        </form>
        <button type="button" data-part="close">Close</button>
      </dialog>
      <output data-testid="dialog-save-count">{@saves}</output>
      <output data-testid="dialog-saved-name">{@saved}</output>
      <output data-testid="dialog-close-requests">{@close_requests}</output>
      <output data-testid="outside-click-count">{@outside_clicks}</output>
      <button type="button" phx-click="outside" style="position:fixed;top:20px;right:20px">Outside</button>
    </main>
    """
  end

  def handle_event("save", %{"name" => name}, socket),
    do: {:noreply, assign(socket, saved: name, saves: socket.assigns.saves + 1)}

  def handle_event("dialog_request", %{"open" => false}, socket),
    do: {:noreply, update(socket, :close_requests, &(&1 + 1))}

  def handle_event("dialog_request", _, socket), do: {:noreply, socket}

  def handle_event("outside", _, socket),
    do: {:noreply, update(socket, :outside_clicks, &(&1 + 1))}
end
