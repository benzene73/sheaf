defmodule SheafDemo.MixProject do
  use Mix.Project

  def project do
    [
      app: :sheaf_demo,
      version: "0.1.0",
      elixir: "~> 1.20",
      deps: [
        {:sheaf, path: ".."},
        {:bandit, "~> 1.12"},
        {:jason, "~> 1.4"}
      ]
    ]
  end

  def application, do: [mod: {Lab.Application, []}, extra_applications: [:logger]]
end
