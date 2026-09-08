defmodule Lab.HomeLive do
  use Phoenix.LiveView

  def render(assigns) do
    ~H"""
    <main class="lab-home">
      <p class="lab-eyebrow">Phoenix LiveView · Base UI</p>
      <h1>Sheaf</h1>
      <p class="lab-intro">Try the controls, including their keyboard behavior. These are experimental ports of selected Base UI behaviors, with native browser primitives underneath where appropriate.</p>
      <div class="lab-grid">
        <.link :for={{title, path, description} <- [
          {"Phoenix forms", "/forms", "Field-backed inputs, validation, custom options, save and reset without a custom selection protocol."},
          {"Combobox", "/paired", "Search, choose, validate on the server, and keep editing without stale replies taking over."},
          {"Combobox labels", "/label-combobox", "Display a readable label while storing and submitting its stable ID."},
          {"Menu", "/menu", "Actions with keyboard navigation, typeahead, focus restoration, and outside dismissal."},
          {"Menu form actions", "/menu-form", "Native submit buttons keep their form name and value with keyboard or pointer activation."},
          {"Select", "/select", "Choose a value with the keyboard or pointer; submit it through a normal form."},
          {"Popover", "/positioning?behavior=true&size=normal", "Positioned content with keyboard focus and viewport collision handling."},
          {"Dialog", "/dialog", "A native modal with controlled dismissal, form updates, and browser-managed focus."},
          {"Number field", "/number-field", "Decimal input, fractional steps, bounds, and numeric form values."},
          {"Tabs", "/tabs", "Manual keyboard activation and clear separation between focus and selection."},
          {"Accordion", "/accordion", "Expandable sections with native keyboard activation and one section open at a time."},
          {"Tooltip", "/tooltip", "Brief descriptions on keyboard focus or hover, without moving focus."},
          {"Toggle group", "/toggle-group", "A compact set of pressed buttons for view modes and toolbar choices."},
          {"Component API", "/components", "The same hooks behind reusable, unstyled Phoenix components."},
          {"Edit form", "/nested", "A Select inside a Dialog: selection, dismissal, and saving without losing the modal."}
        ]} navigate={path} class="lab-card">
          <h2>{title} <span aria-hidden="true">↗</span></h2>
          <p>{description}</p>
        </.link>
      </div>
      <p class="lab-note">Current verification target: Chromium. This is a local playground; Kaguya and Nila are unchanged.</p>
      <.link navigate="/">Historical ten-minute prototype</.link>
    </main>
    """
  end
end
