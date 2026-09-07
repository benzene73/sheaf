Application.put_env(:primitive_lab, Lab.Endpoint,
  url: [host: "localhost"], http: [ip: {0, 0, 0, 0}, port: 4197],
  adapter: Bandit.PhoenixAdapter, server: true,
  secret_key_base: String.duplicate("lab-only-secret-", 5),
  live_view: [signing_salt: "lab-salt"], pubsub_server: Lab.PubSub,
  check_origin: false, render_errors: [formats: [html: Lab.ErrorHTML], layout: false]
)
defmodule Lab.ErrorHTML do
  def render(_, _), do: "Fixture error"
end
defmodule Lab.Layout do
  use Phoenix.Component
  def root(assigns) do
    ~H"""
    <!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="csrf-token" content={Plug.CSRFProtection.get_csrf_token()}/><title>Primitive viability lab</title>
    <script defer src="/app.js"></script>
    <style>body{font:16px system-ui;background:#161616;color:#eee}dialog{background:#242424;color:#eee;border:1px solid #555;padding:24px;width:360px}dialog::backdrop{background:#0008}input,button{font:inherit;padding:8px}input{width:90%}[role=option]{display:block;width:100%;text-align:left}[aria-selected=true]{background:#9ccaff}[hidden]{display:none!important}</style>
    </head><body>{@inner_content}</body></html>
    """
  end
end
defmodule Lab.Live do
  use Phoenix.LiveView
  def mount(_, _, socket), do: {:ok, assign(socket, gen: 0, result_gen: -1, options: [], accepted: "", error: "", tick: 0, arrivals: 0)}
  def render(assigns) do
    ~H"""
    <main><h1>LiveView behavioral trial</h1>
    <dialog id="modal" phx-hook="NativeDialog" phx-mounted={Phoenix.LiveView.JS.ignore_attributes(["open"])} aria-labelledby="title">
      <h2 id="title">Choose a fruit</h2>
      <form id="choice-form" phx-submit="noop" phx-change="noop">
      <div id="combo" phx-hook="Combo" data-accepted={@accepted}>
        <label for="query">Search</label>
        <input id="query" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="options" autocomplete="off" phx-mounted={Phoenix.LiveView.JS.ignore_attributes(["value"])}/>
        <div id="options" role="listbox" aria-label="Fruit" data-generation={@result_gen} data-patch={@tick} hidden>
          <button :for={item <- @options} id={"option-#{item}"} type="button" role="option" data-value={item} data-patch={@tick} aria-selected="false" tabindex="-1">{item}</button>
        </div>
        <input id="accepted" type="hidden" name="fruit" value={@accepted}/>
        <p>Accepted: <span id="accepted-label">{@accepted}</span></p>
        <p id="error" role="status">{@error}</p>
      </div>
      <button id="patch" type="button" phx-click="patch">Unrelated patch</button>
      </form>
      <output id="tick">{@tick}</output><output id="arrivals">{@arrivals}</output>
    </dialog></main>
    """
  end
  def handle_event("search", %{"query" => q, "generation" => g}, socket) do
    delay = if q == "slow", do: 450, else: 35
    Process.send_after(self(), {:results, q, g}, delay)
    {:noreply, assign(socket, gen: g)}
  end
  def handle_event("choose", %{"value" => value, "generation" => g}, socket) do
    cond do
      g != socket.assigns.gen or g != socket.assigns.result_gen or value not in socket.assigns.options -> {:noreply, socket}
      value == "Cherry" -> {:noreply, assign(socket, error: "Selection rejected")}
      true -> {:noreply, assign(socket, accepted: value, error: "")}
    end
  end
  def handle_event("patch", _, socket), do: {:noreply, update(socket, :tick, &(&1 + 1))}
  def handle_event("noop", _, socket), do: {:noreply, socket}
  def handle_info({:results, q, g}, socket) do
    socket = update(socket, :arrivals, &(&1 + 1))
    if g == socket.assigns.gen do
      items = case q do
        "slow" -> ["Apple"]
        "fast" -> ["Banana"]
        _ -> Enum.filter(["Apple", "Banana", "Cherry"], &String.contains?(String.downcase(&1), String.downcase(q)))
      end
      {:noreply, assign(socket, options: items, result_gen: g)}
    else
      {:noreply, socket}
    end
  end
end
defmodule Lab.Router do
  use Phoenix.Router
  import Phoenix.LiveView.Router
  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :protect_from_forgery
    plug :put_root_layout, html: {Lab.Layout, :root}
  end
  scope "/" do
    pipe_through :browser
    live "/", Lab.Live
  end
end
defmodule Lab.Endpoint do
  use Phoenix.Endpoint, otp_app: :primitive_lab
  @session [store: :cookie, key: "_primitive_lab", signing_salt: "lab-cookie"]
  socket "/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session]]
  plug Plug.Static, at: "/", from: "/mnt/d/liveview-primitives-lab/public"
  plug Plug.Parsers, parsers: [:urlencoded, :multipart], pass: ["*/*"]
  plug Plug.Session, @session
  plug Lab.Router
end
for app <- [:phoenix_live_view, :bandit], do: Application.ensure_all_started(app)
{:ok, _} = Supervisor.start_link([{Phoenix.PubSub, name: Lab.PubSub}, Lab.Endpoint], strategy: :one_for_one)
Process.sleep(:infinity)
