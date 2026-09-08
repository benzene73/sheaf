defmodule Lab.Endpoint do
  use Phoenix.Endpoint, otp_app: :sheaf_demo
  @session [store: :cookie, key: "_primitive_lab", signing_salt: "lab-cookie"]
  socket("/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session]])
  plug(Plug.Static, at: "/", from: {:sheaf_demo, "priv/static"})
  plug(Plug.Parsers, parsers: [:urlencoded, :multipart], pass: ["*/*"])
  plug(Plug.Session, @session)
  plug(Lab.Router)
end
