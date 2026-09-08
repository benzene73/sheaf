defmodule Sheaf.FormField do
  @moduledoc "Shared Phoenix form-field normalization for Sheaf inputs."
  import Phoenix.Component, only: [assign: 3, assign_new: 3, used_input?: 1]

  @doc "Derives missing id/name/value and used field errors; explicit assigns take precedence."
  def assign_field(assigns) do
    field = assigns[:field]

    errors =
      case assigns[:errors] do
        nil -> if field && used_input?(field), do: field.errors, else: []
        errors -> errors
      end

    assigns
    |> assign_new(:id, fn -> field && field.id end)
    |> assign_new(:name, fn -> field && field.name end)
    |> assign_new(:value, fn -> field && field.value end)
    |> assign(:errors, Enum.map(errors, &translate(&1, assigns[:translate_error])))
  end

  defp translate(error, translator) when is_function(translator, 1), do: translator.(error)

  defp translate({message, options}, _translator) do
    Enum.reduce(options, message, fn {key, value}, text ->
      if is_binary(value) or is_number(value) or is_atom(value),
        do: String.replace(text, "%{#{key}}", to_string(value)),
        else: text
    end)
  end

  defp translate(message, _translator), do: message
end
