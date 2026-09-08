defmodule Lab.Application do
  use Application

  def start(_type, _args) do
    Supervisor.start_link([{Phoenix.PubSub, name: Lab.PubSub}, Lab.Endpoint],
      strategy: :one_for_one,
      name: Lab.Supervisor
    )
  end
end
