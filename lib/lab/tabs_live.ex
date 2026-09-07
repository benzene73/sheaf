defmodule Lab.TabsLive do
  use Phoenix.LiveView
  alias LiveViewPrimitives.Controls

  def mount(params, _, socket),
    do: {:ok, assign(socket, auto: params["auto"] == "true", selected: "overview")}

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <Controls.tabs id="tabs-fixture" label="Sections" default_value="overview" activate_on_focus={@auto}>
        <:item value="overview" label="Overview">Overview panel</:item>
        <:item value="disabled" label="Disabled" disabled>Disabled panel</:item>
        <:item value="reviews" label="Reviews">Reviews panel</:item>
      </Controls.tabs>
      <button type="button">Outside</button>
    </main>
    """
  end

  def handle_event("tabs_change", %{"value" => value}, socket)
      when value in ["overview", "reviews"],
      do: {:noreply, assign(socket, selected: value)}
end
