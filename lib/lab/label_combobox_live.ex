defmodule Lab.LabelComboboxLive do
  use Phoenix.LiveView
  import Sheaf.Combobox

  def mount(_, _, socket),
    do:
      {:ok,
       assign(socket, accepted: "gb", instance: nil, intent: 0, latest_request: 0, submitted: "")}

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <h1>Combobox labels and values</h1>
      <form id="country-form" phx-submit="submit">
        <.combobox id="country-combobox" label="Country" name="country" value={@accepted}
          options={[%{value: "gb", label: "United Kingdom"}, %{value: "in", label: "India"}]} />
        <button type="submit">Submit</button>
      </form>
      <output data-testid="accepted-value">{@accepted}</output>
      <output data-testid="last-submitted-value">{@submitted}</output>
      <button type="button">Outside</button>
    </main>
    """
  end

  def handle_event(
        "combobox_mount",
        %{"component_id" => "country-combobox", "instance" => instance},
        socket
      )
      when is_binary(instance) and byte_size(instance) == 32,
      do: {:noreply, assign(socket, instance: instance, intent: 0, latest_request: 0)}

  def handle_event(
        "intent",
        %{
          "component_id" => "country-combobox",
          "instance" => instance,
          "generation" => generation
        },
        socket
      )
      when is_integer(generation) do
    {:noreply,
     if(instance == socket.assigns.instance,
       do: assign(socket, intent: max(generation, socket.assigns.intent)),
       else: socket
     )}
  end

  def handle_event(
        "select",
        %{
          "component_id" => "country-combobox",
          "instance" => instance,
          "value" => value,
          "request_id" => request,
          "generation" => generation
        },
        socket
      )
      when value in ["gb", "in", nil] and is_integer(request) and is_integer(generation) do
    if instance == socket.assigns.instance do
      send(self(), {:selection, instance, request, generation, value})
      {:reply, %{pending: true}, assign(socket, latest_request: request, intent: generation)}
    else
      {:reply, %{pending: false}, socket}
    end
  end

  def handle_event("submit", %{"country" => country}, socket),
    do: {:noreply, assign(socket, submitted: country)}

  def handle_info({:selection, instance, request, generation, value}, socket) do
    current =
      instance == socket.assigns.instance and request == socket.assigns.latest_request and
        generation == socket.assigns.intent

    socket = if current, do: assign(socket, accepted: value), else: socket

    {:noreply,
     push_event(socket, "selection_result", %{
       component_id: "country-combobox",
       instance: instance,
       request_id: request,
       generation: generation,
       accepted: current,
       obsolete: not current,
       value: socket.assigns.accepted
     })}
  end
end
