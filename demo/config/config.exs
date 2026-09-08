import Config

config :sheaf_demo, Lab.Endpoint,
  url: [host: "localhost"],
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT", "4197"))],
  adapter: Bandit.PhoenixAdapter,
  server: true,
  secret_key_base: String.duplicate("lab-only-secret-", 5),
  live_view: [signing_salt: "lab-salt"],
  pubsub_server: Lab.PubSub,
  check_origin: false,
  render_errors: [formats: [html: Lab.ErrorHTML], layout: false]

config :phoenix, :json_library, Jason
