defmodule Lab.TooltipLive do
  use Phoenix.LiveView

  def render(assigns) do
    ~H"""
    <main id="tooltip-fixture" phx-hook="PortedTooltip" data-delay="0">
      <p>Tooltip: immediate delay, non-hoverable popup.</p>
      <button id="tooltip-trigger" data-tooltip-trigger type="button" style="margin:80px">Help</button>
      <div id="tooltip-popup" data-tooltip-popup data-testid="tooltip-popup" role="tooltip" popover="manual"
        style="margin:0;inset:auto;padding:8px 12px;border:1px solid #888;border-radius:6px;background:#222;color:white;max-width:var(--available-width)">
        Helpful information
      </div>
      <button type="button" style="position:fixed;right:24px;bottom:24px">Outside</button>
    </main>
    """
  end
end
