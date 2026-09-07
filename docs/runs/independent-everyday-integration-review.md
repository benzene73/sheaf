# Bounded everyday integration review

This is a source review of current public hooks and example markup, intentionally not another broad browser matrix. Existing everyday interaction suites already cover the tested mechanics; the highest-value remaining concerns are ordinary reuse contracts.

## Fix before reuse in a product

1. NativeSelect.sync assigns anchor.textContent directly. This deletes a trigger's chevron/icon/decorative markup on mount and every patch, and displays the machine value rather than the option label. A country select with value GB and label United Kingdom would show GB. Use an explicit value-label child, preserve the rest of the trigger, and resolve label separately from canonical value. The current fixture masks this because values equal labels and trigger contains plain text.
2. NativeMenu menu_action and NativeSelect select_value use fixed events without component identity. Two controls on one LiveView can operate visually independently, but their host receives indistinguishable payloads when values overlap and cannot choose which field/action source to update. Give the public adapter a DOM-ID-correlated payload or a documented per-instance event/target API. This is not the former Combobox broadcast corruption, but is a basic reusable component contract absent from the one-control fixtures.

## No new issue found in these ordinary paths

Example triggers explicitly use type=button, and option/menu items are divs; ordinary activation therefore does not accidentally submit a surrounding form. Closed native-popover content is hidden by the platform and is not an extra normal Tab stop. Listener and positioner ownership is per instance; no global mutable open/menu state is present. Arbitrary nested menus, custom item renderers, and dynamic root replacement remain outside the declared contract and are not grounds for another broad test expansion now.

## Recommendation

Address the two small API gaps as controls become actual reusable components, then move to the next component. Do not delay that work for another matrix of hypothetical interactions. A shared HEEx component should own unique IDs, aria relationships, type=button, required data parts and hidden value inputs, so consumers do not copy fixture markup by hand.
