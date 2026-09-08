defmodule Sheaf.Combobox do
  @moduledoc """
  Searchable Phoenix form control with local filtering and immediate selection.
  Asynchronous server approval is an explicit opt-in through `mode="async"`.
  """
  use Phoenix.Component
  alias Phoenix.LiveView.JS

  attr(:field, Phoenix.HTML.FormField, default: nil)
  attr(:id, :string)
  attr(:label, :string, required: true)

  attr(:options, :list,
    required: true,
    doc:
      "Maps with unique nonempty string :value, optional string :label, and optional :disabled."
  )

  attr(:value, :string, doc: "Selected value; defaults to the supplied form field's value.")

  attr(:accepted_label, :string,
    default: nil,
    doc: "Selected label fallback when value is absent from options."
  )

  attr(:name, :string)
  attr(:errors, :list, default: nil)
  attr(:translate_error, :any, default: nil)
  attr(:described_by, :string, default: nil)
  attr(:error_class, :string, default: nil)
  attr(:mode, :string, default: "form", values: ["form", "async"])
  attr(:placeholder, :string, default: nil)
  attr(:disabled, :boolean, default: false)
  attr(:read_only, :boolean, default: false)
  attr(:loop, :boolean, default: true)
  attr(:cancel_input, :boolean, default: false)
  attr(:cancel_close, :boolean, default: false)
  attr(:class, :string, default: nil)
  attr(:label_class, :string, default: nil)
  attr(:input_class, :string, default: nil)
  attr(:popup_class, :string, default: nil)
  attr(:item_class, :string, default: nil)
  attr(:rest, :global)

  slot(:item,
    doc: "Optional option content; receives the original option map with normalized label."
  )

  def combobox(assigns) do
    assigns = Sheaf.FormField.assign_field(assigns)

    unless is_binary(assigns.id) and assigns.id != "",
      do: raise(ArgumentError, "Combobox requires an id or form field")

    options = validate_options!(assigns.options)
    selected = Enum.find(options, &(&1.value == assigns.value))

    selected_label =
      if selected, do: selected.label, else: assigns.accepted_label || assigns.value || ""

    described_by =
      Enum.reject(
        [assigns.described_by, if(assigns.errors != [], do: assigns.id <> "-errors")],
        &is_nil/1
      )
      |> Enum.join(" ")

    assigns =
      assigns
      |> assign(:options, options)
      |> assign(:selected_label, selected_label)
      |> assign(:input_described_by, if(described_by == "", do: nil, else: described_by))

    ~H"""
    <div {@rest} id={@id} class={@class} phx-hook="PortedCombobox"
      data-mode={@mode}
      data-accepted={@value || ""} data-accepted-label={@selected_label} data-loop={to_string(@loop)}
      data-cancel-input={to_string(@cancel_input)} data-cancel-close={to_string(@cancel_close)}>
      <label for={@id <> "-input"} class={@label_class}>{@label}</label>
      <input id={@id <> "-input"} data-part="input" type="text" role="combobox"
        aria-autocomplete="list" aria-expanded="false" aria-controls={@id <> "-options"}
        aria-invalid={if @errors != [], do: "true"} aria-describedby={@input_described_by}
        autocomplete="off" readonly={@read_only} disabled={@disabled}
        placeholder={@placeholder} class={@input_class} value={@selected_label}
        phx-mounted={JS.ignore_attributes(["value"])} />
      <div id={@id <> "-options"} data-part="list" role="listbox" aria-label={@label}
        class={@popup_class} popover="manual"
        style="position:fixed;margin:0;inset:auto;box-sizing:border-box;width:var(--anchor-width);max-width:var(--available-width);max-height:var(--available-height);overflow:auto" hidden>
        <div :for={option <- @options} id={@id <> "-option-" <> URI.encode_www_form(option.value)}
          role="option" aria-label={option.label} data-value={option.value} data-label={option.label} class={@item_class}
          aria-disabled={to_string(Map.get(option, :disabled, false))}
          aria-selected={to_string(option.value == @value)}>
          <%= if @item == [] do %>{option.label}<% else %>{render_slot(@item, option)}<% end %>
        </div>
      </div>
      <input :if={@name} id={@id <> "-hidden"} type="hidden" name={@name}
        data-part="value" value={@value || ""} disabled={@disabled} />
      <div :if={@errors != []} id={@id <> "-errors"} class={@error_class}>
        <p :for={error <- @errors}>{error}</p>
      </div>
    </div>
    """
  end

  defp validate_options!(options) do
    normalized =
      Enum.map(options, fn option ->
        value = Map.get(option, :value)
        label = Map.get(option, :label, value)

        unless is_binary(value) and value != "" and is_binary(label) do
          raise ArgumentError,
                "Combobox options require nonempty string values and string labels"
        end

        Map.put(option, :label, label)
      end)

    values = Enum.map(normalized, & &1.value)

    if length(Enum.uniq(values)) != length(values),
      do: raise(ArgumentError, "Combobox option values must be unique")

    normalized
  end
end
