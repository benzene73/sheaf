defmodule Lab.PositioningLive do
  use Phoenix.LiveView

  def mount(params, _, socket) do
    {width, height} =
      case params["size"] do
        "wide" -> {1000, 100}
        "normal" -> {200, 100}
        _ -> {200, 1000}
      end

    {:ok,
     assign(socket,
       width: width,
       height: height,
       behavior: params["behavior"] == "true",
       modal: params["modal"] == "true",
       actions: 0,
       outside_clicks: 0
     )}
  end

  def render(assigns) do
    ~H"""
    <main id="positioned-popover" phx-hook="NativePositionedPopover" data-modal={to_string(@modal)}>
      <button type="button" data-part="anchor" data-testid="anchor" popovertarget="positioning-layer" aria-haspopup="dialog" aria-controls="positioning-panel"
        style="position:fixed;bottom:8px;left:16px;width:100px;height:40px;box-sizing:border-box">Open</button>
      <div id="positioning-layer" data-part="layer" popover="auto"
        style="position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;max-width:none;max-height:none;background:transparent;pointer-events:none;overflow:visible">
      <div data-part="backdrop" hidden={not @modal} style="position:fixed;inset:0;pointer-events:auto"></div>
      <div id="positioning-panel" data-part="positioner" data-testid="positioner"
        style="margin:0;inset:auto;padding:0;border:0;width:max-content;overflow:visible;background:transparent;color:inherit;pointer-events:auto">
        <div data-part="popup" data-testid="popup" role="dialog" aria-label="Positioning fixture" tabindex="-1"
          style={"box-sizing:border-box;width:#{@width}px;height:#{@height}px;max-width:var(--available-width);max-height:var(--available-height);overflow:auto;background:#333;border:0;padding:0"}>
          Positioning content
          <button :if={@behavior} type="button" phx-click="inside">Inside</button>
          <button :if={@behavior} type="button">Last</button>
        </div>
      </div>
      </div>
      <output :if={@behavior} data-testid="popover-action-count">{@actions}</output>
      <output :if={@behavior} data-testid="outside-click-count">{@outside_clicks}</output>
      <button :if={@behavior} type="button" phx-click="outside" style="position:fixed;top:20px;right:20px">Outside</button>
    </main>
    """
  end

  def handle_event("inside", _, socket), do: {:noreply, update(socket, :actions, &(&1 + 1))}

  def handle_event("outside", _, socket),
    do: {:noreply, update(socket, :outside_clicks, &(&1 + 1))}
end
