defmodule PrimitiveLab.MixProject do
  use Mix.Project
  def project do
    [app: :primitive_lab, version: "0.0.1", elixir: "~> 1.15",
     deps: [{:phoenix_live_view, "~> 1.2.9"}, {:bandit, "~> 1.12"}]]
  end
  def application, do: [extra_applications: [:logger]]
end
