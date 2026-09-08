defmodule Lab.Live do
  use Phoenix.LiveView

  def mount(_, _, socket),
    do:
      {:ok,
       assign(socket,
         gen: 0,
         result_gen: -1,
         options: [],
         accepted: "",
         error: "",
         tick: 0,
         arrivals: 0
       )}

  def render(assigns) do
    ~H"""
    <main><h1>LiveView behavioral trial</h1>
    <dialog id="modal" phx-hook="NativeDialog" phx-mounted={Phoenix.LiveView.JS.ignore_attributes(["open"])} aria-labelledby="title">
      <h2 id="title">Choose a fruit</h2>
      <form id="choice-form" phx-submit="noop" phx-change="noop">
      <div id="combo" phx-hook="Combo" data-accepted={@accepted}>
        <label for="query">Search</label>
        <input id="query" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="options" autocomplete="off" phx-mounted={Phoenix.LiveView.JS.ignore_attributes(["value"])}/>
        <div id="options" role="listbox" aria-label="Fruit" data-generation={@result_gen} data-patch={@tick} hidden>
          <button :for={item <- @options} id={"option-#{item}"} type="button" role="option" data-value={item} data-patch={@tick} aria-selected="false" tabindex="-1">{item}</button>
        </div>
        <input id="accepted" type="hidden" name="fruit" value={@accepted}/>
        <p>Accepted: <span id="accepted-label">{@accepted}</span></p>
        <p id="error" role="status">{@error}</p>
      </div>
      <button id="patch" type="button" phx-click="patch">Unrelated patch</button>
      </form>
      <output id="tick">{@tick}</output><output id="arrivals">{@arrivals}</output>
    </dialog></main>
    """
  end

  def handle_event("search", %{"query" => q, "generation" => g}, socket) do
    delay = if q == "slow", do: 450, else: 35
    Process.send_after(self(), {:results, q, g}, delay)
    {:noreply, assign(socket, gen: g)}
  end

  def handle_event("choose", %{"value" => value, "generation" => g}, socket) do
    cond do
      g != socket.assigns.gen or g != socket.assigns.result_gen or
          value not in socket.assigns.options ->
        {:noreply, socket}

      value == "Cherry" ->
        {:noreply, assign(socket, error: "Selection rejected")}

      true ->
        {:noreply, assign(socket, accepted: value, error: "")}
    end
  end

  def handle_event("patch", _, socket), do: {:noreply, update(socket, :tick, &(&1 + 1))}
  def handle_event("noop", _, socket), do: {:noreply, socket}

  def handle_info({:results, q, g}, socket) do
    socket = update(socket, :arrivals, &(&1 + 1))

    if g == socket.assigns.gen do
      items =
        case q do
          "slow" ->
            ["Apple"]

          "fast" ->
            ["Banana"]

          _ ->
            Enum.filter(
              ["Apple", "Banana", "Cherry"],
              &String.contains?(String.downcase(&1), String.downcase(q))
            )
        end

      {:noreply, assign(socket, options: items, result_gen: g)}
    else
      {:noreply, socket}
    end
  end
end
