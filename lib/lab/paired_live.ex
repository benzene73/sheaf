defmodule Lab.PairedLive do
  use Phoenix.LiveView

  def mount(params, _, socket) do
    {:ok,
     assign(socket,
       accepted: if(params["defaultValue"] == "Apple", do: "Apple", else: ""),
       tick: 0,
       submits: 0,
       submitted: "",
       items:
         if(params["items"] == "locale",
           do: ["Café", "Tea", "Apple", "Banana", "Cherry"],
           else: ["Apple", "Banana", "Cherry"]
         ),
       settled: 0,
       intent: 0,
       latest_request: 0,
       instance: nil,
       show: true,
       delay: if(params["delay"] == "true", do: 200, else: 0),
       reverse: params["reverse"] == "true",
       loop: params["loop"] != "false",
       cancel_value: params["cancelValue"] == "true",
       cancel_close: params["cancelClose"] == "true",
       cancel_input: params["cancelInput"] == "true",
       read_only: params["readOnly"] == "true"
     )}
  end

  def render(assigns) do
    ~H"""
    <main>
      <h1>Paired behavioral fixture</h1>
      <form id="paired-form" phx-submit="submit">
      <div :if={@show} id="fruit-combobox" phx-hook="PortedCombobox" data-accepted={@accepted} data-loop={to_string(@loop)}
        data-cancel-close={to_string(@cancel_close)} data-cancel-input={to_string(@cancel_input)}>
        <label for="fruit-input">Fruit</label>
        <input id="fruit-input" data-part="input" role="combobox" aria-autocomplete="list"
          aria-expanded="false" aria-controls="fruit-options" autocomplete="off" readonly={@read_only}
          value={@accepted} phx-mounted={Phoenix.LiveView.JS.ignore_attributes(["value"])} />
        <div id="fruit-options" data-part="list" role="listbox" aria-label="Fruit" hidden>
          <div :for={item <- @items} id={"fruit-#{item}"}
            role="option" data-value={item} aria-disabled={to_string(item == "Banana")}
            aria-selected={to_string(@accepted == item)} data-patch={@tick}>{item}</div>
        </div>
          <output data-testid="accepted-value">{@accepted}</output>
          <input type="hidden" name="fruit" value={@accepted} />
          <output id="paired-value-changes" data-testid="value-change-count" data-part="value-change-count" phx-update="ignore">0</output>
      </div>
      <output data-testid="submit-count">{@submits}</output>
      <output data-testid="last-submitted-value">{@submitted}</output>
      <button type="submit">Submit</button>
      </form>
      <button id="paired-outside" type="button">Outside</button>
      <button id="paired-patch" type="button" phx-click="patch">Unrelated patch</button>
      <button id="paired-external" type="button" phx-click="external">External value update</button>
      <button id="paired-remove-option" type="button" phx-click="remove_option">Remove option</button>
      <button id="paired-replace-option" type="button" phx-click="replace_option">Replace option</button>
      <button id="paired-unmount" type="button" phx-click="unmount">Unmount combobox</button>
      <button id="paired-mount" type="button" phx-click="mount">Mount combobox</button>
      <output id="paired-tick">{@tick}</output>
      <output data-testid="settled-count">{@settled}</output>
      <output data-testid="pending-request">{@latest_request}</output>
    </main>
    """
  end

  def handle_event(
        "combobox_mount",
        %{"component_id" => "fruit-combobox", "instance" => instance},
        socket
      )
      when is_binary(instance) and byte_size(instance) == 32 do
    if socket.assigns.show do
      {:noreply, assign(socket, instance: instance, intent: 0, latest_request: 0)}
    else
      {:noreply, socket}
    end
  end

  def handle_event(
        "select",
        %{
          "component_id" => "fruit-combobox",
          "instance" => instance,
          "value" => value,
          "request_id" => request_id,
          "generation" => generation
        },
        socket
      )
      when value in ["Apple", "Cherry", "Café", "Tea", "Date", nil] and is_integer(request_id) and
             is_integer(generation) do
    delay =
      if socket.assigns.reverse,
        do: if(value == "Apple", do: 400, else: 20),
        else: socket.assigns.delay

    if socket.assigns.show and instance == socket.assigns.instance do
      Process.send_after(self(), {:selection, value, request_id, generation, instance}, delay)
      {:reply, %{pending: true}, assign(socket, latest_request: request_id, intent: generation)}
    else
      {:reply, %{pending: false}, socket}
    end
  end

  def handle_event(
        "intent",
        %{"component_id" => "fruit-combobox", "instance" => instance, "generation" => generation},
        socket
      )
      when is_integer(generation) do
    {:noreply,
     if(instance == socket.assigns.instance,
       do: assign(socket, intent: max(generation, socket.assigns.intent)),
       else: socket
     )}
  end

  def handle_event("submit", params, socket),
    do:
      {:noreply,
       socket |> update(:submits, &(&1 + 1)) |> assign(:submitted, params["fruit"] || "")}

  def handle_event("patch", _, socket), do: {:noreply, update(socket, :tick, &(&1 + 1))}
  def handle_event("external", _, socket), do: {:noreply, assign(socket, accepted: "Apple")}

  def handle_event("remove_option", _, socket),
    do:
      {:noreply,
       socket
       |> assign(:items, Enum.reject(socket.assigns.items, &(&1 == "Cherry")))
       |> update(:tick, &(&1 + 1))}

  def handle_event("replace_option", _, socket),
    do:
      {:noreply,
       socket
       |> assign(
         :items,
         Enum.map(socket.assigns.items, &if(&1 == "Cherry", do: "Date", else: &1))
       )
       |> update(:tick, &(&1 + 1))}

  def handle_event("unmount", _, socket),
    do: {:noreply, assign(socket, show: false, instance: nil, accepted: "")}

  def handle_event("mount", _, socket), do: {:noreply, assign(socket, show: true, accepted: "")}

  def handle_info({:selection, value, request_id, generation, instance}, socket) do
    current =
      socket.assigns.show and instance == socket.assigns.instance and
        request_id == socket.assigns.latest_request and generation == socket.assigns.intent

    accepted = current and not socket.assigns.cancel_value and not socket.assigns.read_only
    socket = if accepted, do: assign(socket, accepted: value || ""), else: socket
    socket = update(socket, :settled, &(&1 + 1))

    {:noreply,
     push_event(socket, "selection_result", %{
       component_id: "fruit-combobox",
       instance: instance,
       accepted: accepted,
       obsolete: not current,
       value: socket.assigns.accepted,
       request_id: request_id,
       generation: generation
     })}
  end
end
