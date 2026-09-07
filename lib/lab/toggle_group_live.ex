defmodule Lab.ToggleGroupLive do
  use Phoenix.LiveView
  alias LiveViewPrimitives.Controls

  def mount(params, _, socket),
    do: {:ok, assign(socket, multiple: params["multiple"] == "true", values: ["grid"])}

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <Controls.toggle_group id="toggle-group-fixture" label="View" multiple={@multiple} default_value={["grid"]}
        options={[%{value: "grid", label: "Grid"}, %{value: "list", label: "List"}, %{value: "disabled", label: "Disabled", disabled: true}]} />
      <output data-testid="toggle-value">{Enum.join(@values, ",")}</output>
      <button type="button">Outside</button>
    </main>
    """
  end

  def handle_event("toggle_change", %{"values" => values}, socket) when is_list(values) do
    {:noreply, assign(socket, values: Enum.filter(values, &(&1 in ["grid", "list"])))}
  end
end
