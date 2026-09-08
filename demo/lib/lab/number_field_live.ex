defmodule Lab.NumberFieldLive do
  use Phoenix.LiveView
  alias Sheaf.Controls

  def mount(_, _, socket), do: {:ok, assign(socket, value: 10, submitted: "", submits: 0)}

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <form id="number-form" phx-submit="submit">
        <Controls.number_field mode="observer" id="amount-field" label="Amount" name="amount" default_value={10}
          min={0} max={100} step={0.5} format={%{maximumFractionDigits: 2}} />
        <button type="submit">Submit</button>
      </form>
      <button type="button">Outside</button>
      <output data-testid="number-value">{display_number(@value)}</output>
      <output data-testid="number-submitted-value">{@submitted}</output>
      <output data-testid="number-submit-count">{@submits}</output>
    </main>
    """
  end

  def handle_event("number_change", %{"value" => value}, socket)
      when is_nil(value) or (is_number(value) and value >= 0 and value <= 100),
      do: {:noreply, assign(socket, value: value)}

  def handle_event("number_commit", _, socket), do: {:noreply, socket}

  def handle_event("submit", %{"amount" => value}, socket),
    do: {:noreply, assign(socket, submitted: value, submits: socket.assigns.submits + 1)}

  defp display_number(nil), do: ""

  defp display_number(value) when is_float(value) and trunc(value) == value,
    do: Integer.to_string(trunc(value))

  defp display_number(value), do: to_string(value)
end
