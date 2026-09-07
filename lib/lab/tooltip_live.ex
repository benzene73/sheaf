defmodule Lab.TooltipLive do
  use Phoenix.LiveView
  alias LiveViewPrimitives.Controls

  def render(assigns) do
    ~H"""
    <main class="lab-demo">
      <p>Tooltip: immediate delay, non-hoverable popup.</p>
      <Controls.tooltip id="tooltip-fixture" delay={0} popup_testid="tooltip-popup">
        <:trigger>Help</:trigger>
        Helpful information
      </Controls.tooltip>
      <button type="button" style="position:fixed;right:24px;bottom:24px">Outside</button>
    </main>
    """
  end
end
