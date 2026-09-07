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
    live("/paired", Lab.PairedLive)
    live("/positioning", Lab.PositioningLive)
    live("/menu", Lab.MenuLive)
    live("/select", Lab.SelectLive)
  end
end
