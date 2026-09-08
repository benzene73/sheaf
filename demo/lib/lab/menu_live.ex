defmodule Lab.MenuLive do
  use Phoenix.LiveView

  def mount(params, _, socket),
    do:
      {:ok,
       assign(socket,
         action: "",
         outside_clicks: 0,
         modal: params["modal"] != "false",
         keep_open: params["keepOpen"] == "true"
       )}

  def render(assigns) do
    ~H"""
    <main id="menu-fixture" phx-hook="NativeMenu" data-keep-open={to_string(@keep_open)} data-modal={to_string(@modal)}>
      <button type="button" data-part="anchor" aria-haspopup="menu" aria-expanded="false"
        popovertarget="menu-layer" aria-controls="menu-popup">Open menu</button>
      <div id="menu-layer" data-part="layer" popover="auto"
        style="position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;max-width:none;max-height:none;background:transparent;pointer-events:none;overflow:visible">
      <div data-part="backdrop" hidden={not @modal} style="position:fixed;inset:0;pointer-events:auto"></div>
      <div id="menu-popup" data-part="menu" role="menu" aria-label="Actions"
        style="margin:0;inset:auto;padding:4px;border:0;width:max-content;max-width:var(--available-width);max-height:var(--available-height);overflow:auto;background:#333;color:white;pointer-events:auto">
        <div :for={item <- ["Alpha", "Beta", "Bravo", "Charlie"]} id={"menu-#{item}"}
          role="menuitem" tabindex="-1" aria-disabled={to_string(item == "Beta")} data-value={item}
          style="padding:8px 20px">{item}</div>
      </div>
      </div>
      <output data-testid="menu-action">{@action}</output>
      <output data-testid="outside-click-count">{@outside_clicks}</output>
      <button type="button" phx-click="outside" style="position:fixed;right:20px;top:20px">Outside</button>
    </main>
    """
  end

  def handle_event("menu_action", %{"value" => value}, socket)
      when value in ["Alpha", "Bravo", "Charlie"],
      do: {:noreply, assign(socket, action: value)}

  def handle_event("outside", _, socket),
    do: {:noreply, update(socket, :outside_clicks, &(&1 + 1))}
end
