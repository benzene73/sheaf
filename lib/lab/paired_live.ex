defmodule Lab.PairedLive do
  use Phoenix.LiveView

  def mount(params, _, socket) do
    {:ok, assign(socket, accepted: "", tick: 0, loop: params["loop"] != "false")}
  end

  def render(assigns) do
    ~H"""
    <main>
      <h1>Paired behavioral fixture</h1>
      <div id="fruit-combobox" phx-hook="PortedCombobox" data-accepted={@accepted} data-loop={to_string(@loop)}>
        <label for="fruit-input">Fruit</label>
        <input id="fruit-input" data-part="input" role="combobox" aria-autocomplete="list"
          aria-expanded="false" aria-controls="fruit-options" autocomplete="off" />
        <div id="fruit-options" data-part="list" role="listbox" aria-label="Fruit" hidden>
          <div :for={item <- ["Apple", "Banana", "Cherry"]} id={"fruit-#{item}"}
            role="option" data-value={item} aria-disabled={to_string(item == "Banana")}
            aria-selected={to_string(@accepted == item)} data-patch={@tick}>{item}</div>
        </div>
        <output data-testid="accepted-value">{@accepted}</output>
      </div>
      <button id="paired-patch" phx-click="patch">Unrelated patch</button>
      <output id="paired-tick">{@tick}</output>
    </main>
    """
  end

  def handle_event("select", %{"value" => value}, socket) when value in ["Apple", "Cherry"] do
    {:noreply, assign(socket, accepted: value)}
  end

  def handle_event("patch", _, socket), do: {:noreply, update(socket, :tick, &(&1 + 1))}
end
