defmodule Lab.ToggleGroupLive do
  use Phoenix.LiveView

  def mount(params, _, socket),
    do: {:ok, assign(socket, multiple: params["multiple"] == "true", values: ["grid"])}

  def render(assigns) do
    ~H"""
    <main id="toggle-group-fixture" phx-hook="PortedToggleGroup" data-value={Jason.encode!(@values)} data-multiple={to_string(@multiple)}>
      <div role="group" aria-label="View">
        <button :for={{value, label} <- [{"grid", "Grid"}, {"list", "List"}, {"disabled", "Disabled"}]}
          id={"toggle-#{value}"} type="button" data-value={value} disabled={value == "disabled"}
          aria-pressed={to_string(value in @values)} tabindex={if(value == "grid", do: "0", else: "-1")}>{label}</button>
      </div>
      <output data-testid="toggle-value">{Enum.join(@values, ",")}</output>
      <button type="button">Outside</button>
    </main>
    """
  end

  def handle_event("toggle_change", %{"values" => values}, socket) when is_list(values) do
    {:noreply, assign(socket, values: Enum.filter(values, &(&1 in ["grid", "list"])))}
  end
end
