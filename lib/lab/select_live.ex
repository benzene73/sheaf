defmodule Lab.SelectLive do
  use Phoenix.LiveView

  def mount(params, _, socket) do
    {:ok,
     assign(socket,
       value: params["defaultValue"] || "",
       changes: 0,
       cancel_value: params["cancelValue"] == "true",
       modal: params["modal"] != "false",
       outside_clicks: 0,
       submitted: "",
       submits: 0
     )}
  end

  def render(assigns) do
    ~H"""
    <main id="select-fixture" phx-hook="NativeSelect" data-accepted={@value}
      data-cancel-value={to_string(@cancel_value)} data-modal={to_string(@modal)}>
      <form id="select-form" phx-submit="submit">
      <input type="hidden" name="fruit" value={@value} />
      <button type="button" role="combobox" data-part="anchor" aria-label="Choose fruit" aria-haspopup="listbox"
        aria-expanded="false" popovertarget="select-layer" aria-controls="select-popup"><span data-part="value" data-placeholder="Choose">Choose</span></button>
      <div id="select-layer" data-part="layer" popover="auto"
        style="position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;max-width:none;max-height:none;background:transparent;pointer-events:none;overflow:visible">
        <div data-part="backdrop" hidden={not @modal} style="position:fixed;inset:0;pointer-events:auto"></div>
        <div id="select-popup" data-part="select" role="listbox" aria-label="Fruit"
          style="margin:0;inset:auto;padding:4px;border:0;width:max-content;max-width:var(--available-width);max-height:var(--available-height);overflow:auto;background:#333;color:white;pointer-events:auto">
          <div :for={item <- ["Alpha", "Beta", "Bravo", "Charlie"]} id={"select-#{item}"}
            role="option" tabindex="-1" aria-disabled={to_string(item == "Beta")}
            aria-selected={to_string(item == @value)} data-value={item} style="padding:8px 20px">{item}</div>
        </div>
      </div>
      <output data-testid="select-value">{@value}</output>
      <output data-testid="select-change-count">{@changes}</output>
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
      </form>
      <output data-testid="select-submitted-value">{@submitted}</output>
      <output data-testid="select-submit-count">{@submits}</output>
      <output data-testid="outside-click-count">{@outside_clicks}</output>
      <button type="button" phx-click="outside" style="position:fixed;right:20px;top:20px">Outside</button>
    </main>
    """
  end

  def handle_event("select_value", %{"value" => value}, socket)
      when value in ["Alpha", "Bravo", "Charlie"] do
    socket = update(socket, :changes, &(&1 + 1))
    {:noreply, if(socket.assigns.cancel_value, do: socket, else: assign(socket, :value, value))}
  end

  def handle_event("submit", params, socket),
    do:
      {:noreply,
       assign(socket, submitted: params["fruit"] || "", submits: socket.assigns.submits + 1)}

  def handle_event("outside", _, socket),
    do: {:noreply, update(socket, :outside_clicks, &(&1 + 1))}
end
