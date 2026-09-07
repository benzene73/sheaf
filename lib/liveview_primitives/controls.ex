defmodule LiveViewPrimitives.Controls do
  @moduledoc """
  Headless, browser-owned controls. `default_value` is read when the hook mounts;
  later server patches do not reset the user's interaction state.
  """
  use Phoenix.Component
  alias Phoenix.LiveView.JS

  attr(:id, :string, required: true)
  attr(:label, :string, required: true)
  attr(:name, :string, required: true)
  attr(:default_value, :any, default: nil)
  attr(:min, :any, default: nil)
  attr(:max, :any, default: nil)
  attr(:step, :any, default: 1)
  attr(:locale, :string, default: "en-US")
  attr(:format, :map, default: %{})
  attr(:disabled, :boolean, default: false)
  attr(:read_only, :boolean, default: false)
  attr(:class, :string, default: nil)
  attr(:input_class, :string, default: nil)
  attr(:button_class, :string, default: nil)

  def number_field(assigns) do
    ~H"""
    <div id={@id} class={@class} phx-hook="PortedNumberField" data-value={@default_value}
      data-min={@min} data-max={@max} data-step={@step} data-locale={@locale} data-format={Jason.encode!(@format)}>
      <label for={@id <> "-input"}>{@label}</label>
      <button type="button" data-part="decrease" aria-label="Decrease" tabindex="-1"
        aria-controls={@id <> "-input"} class={@button_class} disabled={@disabled or @read_only}>−</button>
      <input id={@id <> "-input"} data-part="input" type="text" inputmode="decimal" aria-label={@label}
        class={@input_class} value={@default_value} disabled={@disabled} readonly={@read_only}
        phx-mounted={JS.ignore_attributes(["value"])} />
      <button type="button" data-part="increase" aria-label="Increase" tabindex="-1"
        aria-controls={@id <> "-input"} class={@button_class} disabled={@disabled or @read_only}>+</button>
      <input id={@id <> "-hidden"} data-part="hidden" type="hidden" name={@name} value={@default_value}
        disabled={@disabled} phx-mounted={JS.ignore_attributes(["value"])} />
    </div>
    """
  end

  attr(:id, :string, required: true)
  attr(:label, :string, required: true)
  attr(:default_value, :string, required: true)
  attr(:activate_on_focus, :boolean, default: false)
  attr(:orientation, :string, values: ["horizontal", "vertical"], default: "horizontal")
  attr(:class, :string, default: nil)
  attr(:tab_class, :string, default: nil)
  attr(:panel_class, :string, default: nil)

  slot :item, required: true do
    attr(:value, :string, required: true)
    attr(:label, :string, required: true)
    attr(:disabled, :boolean)
  end

  def tabs(assigns) do
    ~H"""
    <div id={@id} class={@class} phx-hook="PortedTabs" data-value={@default_value}
      data-auto={to_string(@activate_on_focus)}>
      <div role="tablist" aria-label={@label} aria-orientation={@orientation}>
        <button :for={item <- @item} id={part_id(@id, item.value, "tab")} type="button" role="tab"
          data-value={item.value} class={@tab_class} aria-controls={part_id(@id, item.value, "panel")}
          aria-disabled={to_string(Map.get(item, :disabled, false))}
          aria-selected={to_string(item.value == @default_value)} tabindex={if item.value == @default_value, do: 0, else: -1}>
          {item.label}
        </button>
      </div>
      <section :for={item <- @item} id={part_id(@id, item.value, "panel")} role="tabpanel"
        data-value={item.value} class={@panel_class} aria-labelledby={part_id(@id, item.value, "tab")}
        tabindex="0" hidden={item.value != @default_value}>{render_slot(item)}</section>
    </div>
    """
  end

  attr(:id, :string, required: true)
  attr(:default_value, :list, default: [])
  attr(:multiple, :boolean, default: false)
  attr(:disabled, :boolean, default: false)
  attr(:class, :string, default: nil)
  attr(:trigger_class, :string, default: nil)
  attr(:panel_class, :string, default: nil)

  slot :item, required: true do
    attr(:value, :string, required: true)
    attr(:label, :string, required: true)
    attr(:disabled, :boolean)
  end

  def accordion(assigns) do
    ~H"""
    <div id={@id} class={@class} data-accordion phx-hook="PortedAccordion"
      data-value={Jason.encode!(@default_value)} data-multiple={to_string(@multiple)} data-disabled={to_string(@disabled)}>
      <section :for={item <- @item}>
        <h2>
          <button id={part_id(@id, item.value, "trigger")} type="button" data-part="trigger"
            class={@trigger_class} data-value={item.value} data-panel={part_id(@id, item.value, "panel")}
            aria-controls={if item.value in @default_value, do: part_id(@id, item.value, "panel")}
            aria-expanded={to_string(item.value in @default_value)}
            aria-disabled={to_string(@disabled or Map.get(item, :disabled, false))}>{item.label}</button>
        </h2>
        <div id={part_id(@id, item.value, "panel")} role="region" data-part="panel" class={@panel_class}
          data-value={item.value} aria-labelledby={part_id(@id, item.value, "trigger")}
          hidden={item.value not in @default_value}>{render_slot(item)}</div>
      </section>
    </div>
    """
  end

  attr(:id, :string, required: true)
  attr(:delay, :integer, default: 600)
  attr(:class, :string, default: nil)
  attr(:trigger_class, :string, default: nil)
  attr(:popup_class, :string, default: nil)
  attr(:popup_testid, :string, default: nil)
  slot(:trigger, required: true)
  slot(:inner_block, required: true)

  def tooltip(assigns) do
    ~H"""
    <span id={@id} class={@class} phx-hook="PortedTooltip" data-delay={@delay}>
      <button id={@id <> "-trigger"} data-tooltip-trigger type="button" class={@trigger_class}>{render_slot(@trigger)}</button>
      <span id={@id <> "-popup"} data-tooltip-popup data-testid={@popup_testid} role="tooltip" popover="manual"
        class={@popup_class} style="margin:0;inset:auto;max-width:var(--available-width)">{render_slot(@inner_block)}</span>
    </span>
    """
  end

  attr(:id, :string, required: true)
  attr(:label, :string, required: true)
  attr(:options, :list, required: true)
  attr(:default_value, :list, default: [])
  attr(:multiple, :boolean, default: false)
  attr(:orientation, :string, values: ["horizontal", "vertical"], default: "horizontal")
  attr(:class, :string, default: nil)
  attr(:button_class, :string, default: nil)

  def toggle_group(assigns) do
    first_enabled = Enum.find(assigns.options, &(not Map.get(&1, :disabled, false)))

    selected =
      Enum.find(
        assigns.options,
        &(&1.value in assigns.default_value and not Map.get(&1, :disabled, false))
      )

    initial_focus = selected || first_enabled
    assigns = assign(assigns, :initial_focus, if(initial_focus, do: initial_focus.value))

    ~H"""
    <div id={@id} class={@class} phx-hook="PortedToggleGroup" data-value={Jason.encode!(@default_value)}
      data-multiple={to_string(@multiple)} data-orientation={@orientation}>
      <div role="group" aria-label={@label}>
        <button :for={option <- @options} id={part_id(@id, option.value, "toggle")} type="button"
          class={@button_class} data-value={option.value} disabled={Map.get(option, :disabled, false)}
          aria-pressed={to_string(option.value in @default_value)}
          tabindex={if option.value == @initial_focus, do: 0, else: -1}>{option.label}</button>
      </div>
    </div>
    """
  end

  defp part_id(id, value, part), do: id <> "-" <> URI.encode_www_form(value) <> "-" <> part
end
