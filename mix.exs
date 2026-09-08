defmodule Sheaf.MixProject do
  use Mix.Project

  def project do
    [
      app: :sheaf,
      version: "0.1.0",
      elixir: "~> 1.20",
      description: "Headless Phoenix LiveView components with source-traceable browser behavior",
      package: [files: ["lib/sheaf", "src", "dist", "licenses", "mix.exs", "README.md", "docs"]],
      deps: [{:phoenix_live_view, "~> 1.2.9"}, {:jason, "~> 1.4"}]
    ]
  end

  def application, do: [extra_applications: [:logger]]
end
