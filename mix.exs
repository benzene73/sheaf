defmodule PrimitiveLab.MixProject do
  use Mix.Project

  def project do
    [
      app: :primitive_lab,
      version: "0.1.0",
      elixir: "~> 1.20",
      deps: [{:phoenix_live_view, "~> 1.2.9"}, {:bandit, "~> 1.12"}, {:jason, "~> 1.4"}]
    ]
  end

  def application, do: [mod: {Lab.Application, []}, extra_applications: [:logger]]
end
