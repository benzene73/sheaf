defmodule Sheaf.FormFieldTest do
  use ExUnit.Case, async: true

  defp resolve(extra) do
    Sheaf.FormField.assign_field(Map.merge(%{__changed__: nil}, extra))
  end

  test "derives field identity and value, preserving explicit overrides including nil" do
    field = Phoenix.Component.to_form(%{"country" => "jp"}, as: "profile")[:country]
    derived = resolve(%{field: field})

    assert {derived.id, derived.name, derived.value} ==
             {"profile_country", "profile[country]", "jp"}

    explicit = resolve(%{field: field, id: "custom", name: "destination", value: nil})
    assert {explicit.id, explicit.name, explicit.value} == {"custom", "destination", nil}
  end

  test "suppresses unused errors and renders used errors with interpolation" do
    unused =
      Phoenix.Component.to_form(%{"country" => "", "_unused_country" => ""}, as: "profile")[
        :country
      ]

    used = Phoenix.Component.to_form(%{"country" => ""}, as: "profile")[:country]
    errors = [{"must have %{count} entries", [count: 2]}]
    assert resolve(%{field: %{unused | errors: errors}}).errors == []
    assert resolve(%{field: %{used | errors: errors}}).errors == ["must have 2 entries"]
    assert resolve(%{field: %{used | errors: errors}, errors: []}).errors == []
  end

  test "explicit errors and application translation work without a form field" do
    translated =
      resolve(%{
        errors: [{"invalid", []}],
        translate_error: fn {message, _} -> "translated: " <> message end
      })

    assert translated.errors == ["translated: invalid"]
    assert resolve(%{errors: ["Choose a country"]}).errors == ["Choose a country"]
  end
end
