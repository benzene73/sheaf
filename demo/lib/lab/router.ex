defmodule Lab.Router do
  use Phoenix.Router
  import Phoenix.LiveView.Router

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:protect_from_forgery)
    plug(:put_root_layout, html: {Lab.Layout, :root})
  end

  scope "/" do
    pipe_through(:browser)
    live("/", Lab.Live)
    live("/lab", Lab.HomeLive)
    live("/components", Lab.ComponentsLive)
    live("/nested", Lab.NestedLive)
    live("/forms", Lab.FormsLive)
    live("/paired", Lab.PairedLive)
    live("/label-combobox", Lab.LabelComboboxLive)
    live("/positioning", Lab.PositioningLive)
    live("/menu", Lab.MenuLive)
    live("/menu-form", Lab.MenuFormLive)
    live("/select", Lab.SelectLive)
    live("/dialog", Lab.DialogLive)
    live("/number-field", Lab.NumberFieldLive)
    live("/tabs", Lab.TabsLive)
    live("/accordion", Lab.AccordionLive)
    live("/tooltip", Lab.TooltipLive)
    live("/toggle-group", Lab.ToggleGroupLive)
  end
end
