defmodule Lab.AccordionLive do
  use Phoenix.LiveView
  alias Sheaf.Controls

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <h1>Accordion</h1>
      <Controls.accordion id="accordion-fixture">
        <:item value="overview" label="Overview">Overview content</:item>
        <:item value="reviews" label="Reviews">Reviews content</:item>
        <:item value="disabled" label="Disabled" disabled>Disabled content</:item>
      </Controls.accordion>
    </main>
    """
  end

  def handle_event("accordion_change", _params, socket), do: {:noreply, socket}
end
