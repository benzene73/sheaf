defmodule Sheaf.Components do
  @moduledoc """
  Headless markup for the lab's bounded LiveView hooks. Register the corresponding
  JavaScript hooks with LiveSocket. These components own structure and ARIA, not
  colors or typography. See docs/components.md for state/event ownership.
  """
  use Phoenix.Component
  alias Phoenix.LiveView.JS

  @layer_style "position:fixed;inset:0;margin:0;padding:0;border:0;width:100vw;height:100vh;max-width:none;max-height:none;background:transparent;pointer-events:none;overflow:visible"
  @backdrop_style "position:fixed;inset:0;pointer-events:auto"
  @popup_style "margin:0;inset:auto;width:max-content;max-width:var(--available-width);max-height:var(--available-height);overflow:auto;pointer-events:auto"

  attr(:id, :string, required: true)
  attr(:label, :string, required: true)
  attr(:class, :string, default: nil)
  attr(:trigger_class, :string, default: nil)
  attr(:popup_class, :string, default: nil)
  attr(:close_class, :string, default: nil)
  attr(:close_label, :string, default: "Close")
  attr(:cancel_close, :boolean, default: false)
  attr(:disable_pointer_dismissal, :boolean, default: false)
  attr(:rest, :global)
  slot(:trigger, required: true)
  slot(:inner_block, required: true)

  def dialog(assigns) do
    ~H"""
    <div {@rest} id={@id} class={@class} phx-hook="PortedDialog"
      data-cancel-close={to_string(@cancel_close)}
      data-disable-pointer-dismissal={to_string(@disable_pointer_dismissal)}>
      <button id={@id <> "-trigger"} type="button" data-part="trigger" class={@trigger_class}
        aria-haspopup="dialog" aria-expanded="false" aria-controls={@id <> "-dialog"}>
        {render_slot(@trigger)}
      </button>
      <dialog id={@id <> "-dialog"} data-part="dialog" class={@popup_class} aria-label={@label}
        phx-mounted={JS.ignore_attributes(["open"])}>
        {render_slot(@inner_block)}
        <button type="button" data-part="close" class={@close_class}>{@close_label}</button>
      </dialog>
    </div>
    """
  end

  attr(:id, :string, required: true)
  attr(:label, :string, required: true)

  attr(:options, :list,
    default: [],
    doc: "Maps with string :value, :label and optional boolean :disabled."
  )

  attr(:modal, :boolean, default: true)
  attr(:keep_open, :boolean, default: false)
  attr(:class, :string, default: nil)
  attr(:trigger_class, :string, default: nil)
  attr(:popup_class, :string, default: nil)
  attr(:item_class, :string, default: nil)
  attr(:rest, :global)

  slot(:item,
    doc: "Custom row content; :let receives the option map. Semantic label is retained."
  )

  slot(:trigger, required: true)
  slot(:native_actions, doc: "Caller-owned form containing menu_submit controls.")

  def menu(assigns) do
    assigns = structural_styles(assigns)

    ~H"""
    <div {@rest} id={@id} class={@class} phx-hook="NativeMenu"
      data-modal={to_string(@modal)} data-keep-open={to_string(@keep_open)}>
      <button id={@id <> "-trigger"} type="button" data-part="anchor" class={@trigger_class}
        aria-haspopup="menu" aria-expanded="false" aria-controls={@id <> "-popup"}
        popovertarget={@id <> "-layer"}>{render_slot(@trigger)}</button>
      <div id={@id <> "-layer"} data-part="layer" popover="auto" style={@layer_style}>
        <div data-part="backdrop" hidden={not @modal} style={@backdrop_style}></div>
        <div id={@id <> "-popup"} data-part="menu" role="menu" aria-label={@label}
          class={@popup_class} style={@popup_style}>
          <div :for={option <- @options} id={@id <> "-item-" <> URI.encode_www_form(option.value)}
            data-value={option.value} data-label={option.label} aria-label={option.label} role="menuitem" tabindex="-1"
            aria-disabled={to_string(Map.get(option, :disabled, false))} class={@item_class}>{if @item == [], do: option.label, else: render_slot(@item, option)}</div>
          {render_slot(@native_actions)}
        </div>
      </div>
    </div>
    """
  end

  attr(:field, Phoenix.HTML.FormField, default: nil)
  attr(:id, :string)
  attr(:name, :string)
  attr(:value, :any)
  attr(:label, :string, default: nil)
  attr(:options, :list, required: true)
  attr(:mode, :string, values: ["form", "observer"], default: "form")
  attr(:errors, :list, default: nil)
  attr(:translate_error, :any, default: nil)
  attr(:described_by, :string, default: nil)
  attr(:error_class, :string, default: nil)
  attr(:placeholder, :string, default: "Choose")
  attr(:modal, :boolean, default: true)
  attr(:disabled, :boolean, default: false)
  attr(:read_only, :boolean, default: false)
  attr(:cancel_value, :boolean, default: false)
  attr(:class, :string, default: nil)
  attr(:trigger_class, :string, default: nil)
  attr(:popup_class, :string, default: nil)
  attr(:item_class, :string, default: nil)
  attr(:rest, :global)
  slot(:trigger, doc: "Decoration after the selected semantic label.")

  slot(:item,
    doc:
      "Custom option content; :let receives the option map. The option label remains semantic text."
  )

  def select(assigns) do
    assigns = Sheaf.FormField.assign_field(assigns)
    value = if is_nil(assigns.value), do: nil, else: to_string(assigns.value)
    selected = Enum.find(assigns.options, &(&1.value == value))

    error_ids =
      Enum.with_index(assigns.errors, fn _, index ->
        assigns.id <> "-error-" <> to_string(index)
      end)

    described_by = Enum.reject([assigns.described_by | error_ids], &is_nil/1) |> Enum.join(" ")

    assigns =
      assigns
      |> structural_styles()
      |> assign(:value, value)
      |> assign(:described_by_value, if(described_by == "", do: nil, else: described_by))
      |> assign(:selected_label, if(selected, do: selected.label, else: assigns.placeholder))

    ~H"""
    <div {@rest} id={@id} class={@class} phx-hook="NativeSelect" data-mode={@mode} data-accepted={@value || ""}
      data-modal={to_string(@modal)} data-read-only={to_string(@read_only)} data-cancel-value={to_string(@cancel_value)}>
      <label :if={@label} for={@id <> "-trigger"}>{@label}</label>
      <input :if={@name} id={@id <> "-hidden"} data-part="hidden" type="hidden" name={@name} value={@value || ""} disabled={@disabled} />
      <button id={@id <> "-trigger"} type="button" role="combobox" data-part="anchor"
        class={@trigger_class} disabled={@disabled} aria-readonly={if @read_only, do: "true"}
        aria-label={@label} aria-invalid={if @errors != [], do: "true"} aria-describedby={@described_by_value}
        aria-haspopup="listbox" aria-expanded="false" aria-controls={@id <> "-popup"} popovertarget={@id <> "-layer"}>
        <span data-part="value" data-placeholder={@placeholder}>{@selected_label}</span>
        {render_slot(@trigger)}
      </button>
      <div id={@id <> "-layer"} data-part="layer" popover="auto" style={@layer_style}>
        <div data-part="backdrop" hidden={not @modal} style={@backdrop_style}></div>
        <div id={@id <> "-popup"} data-part="select" role="listbox" aria-label={@label}
          class={@popup_class} style={@popup_style}>
          <div :for={option <- @options} id={@id <> "-item-" <> URI.encode_www_form(option.value)}
            role="option" tabindex="-1" data-value={option.value} data-label={option.label} aria-label={option.label} class={@item_class}
            aria-disabled={to_string(Map.get(option, :disabled, false))}
            aria-selected={to_string(option.value == @value)}>{if @item == [], do: option.label, else: render_slot(@item, option)}</div>
        </div>
      </div>
      <p :for={{error, index} <- Enum.with_index(@errors)} id={@id <> "-error-" <> to_string(index)} class={@error_class}>{error}</p>
    </div>
    """
  end

  attr(:id, :string, required: true)
  attr(:label, :string, required: true)

  attr(:modal, :boolean,
    default: false,
    doc: "Pointer/scroll modality; this is not a complete modal focus manager."
  )

  attr(:class, :string, default: nil)
  attr(:trigger_class, :string, default: nil)
  attr(:popup_class, :string, default: nil)
  attr(:rest, :global)
  slot(:trigger, required: true)
  slot(:inner_block, required: true)

  def popover(assigns) do
    assigns = structural_styles(assigns)

    ~H"""
    <div {@rest} id={@id} class={@class} phx-hook="NativePositionedPopover" data-modal={to_string(@modal)}>
      <button id={@id <> "-trigger"} type="button" data-part="anchor" class={@trigger_class}
        popovertarget={@id <> "-layer"} aria-haspopup="dialog" aria-expanded="false" aria-controls={@id <> "-popup"}>
        {render_slot(@trigger)}
      </button>
      <div id={@id <> "-layer"} data-part="layer" popover="auto" style={@layer_style}>
        <div data-part="backdrop" hidden={not @modal} style={@backdrop_style}></div>
        <div id={@id <> "-positioner"} data-part="positioner"
          style="margin:0;inset:auto;padding:0;border:0;width:max-content;overflow:visible;background:transparent;color:inherit;pointer-events:auto">
          <div id={@id <> "-popup"} data-part="popup" role="dialog" tabindex="-1" aria-label={@label}
            class={@popup_class} style="box-sizing:border-box;max-width:var(--available-width);max-height:var(--available-height);overflow:auto">
            {render_slot(@inner_block)}
          </div>
        </div>
      </div>
    </div>
    """
  end

  attr(:name, :string, required: true)
  attr(:value, :string, required: true)
  attr(:disabled, :boolean, default: false)
  attr(:class, :string, default: nil)

  attr(:rest, :global,
    include: ~w(form formaction formenctype formmethod formnovalidate formtarget)
  )

  slot(:inner_block, required: true)

  def menu_submit(assigns) do
    ~H"""
    <button {@rest} type="submit" role="menuitem" tabindex="-1" data-native-action
      name={@name} value={@value} aria-disabled={to_string(@disabled)} class={@class}>
      {render_slot(@inner_block)}
    </button>
    """
  end

  defp structural_styles(assigns) do
    assigns
    |> assign(:layer_style, @layer_style)
    |> assign(:backdrop_style, @backdrop_style)
    |> assign(:popup_style, @popup_style)
  end
end
