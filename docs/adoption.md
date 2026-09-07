# Adoption targets in Kaguya and Nila

Read-only source inspection on 2026-09-08. No application files or data were changed. This is an applicability assessment, not a fresh browser audit of either application. Lab browser results certify their exercised fixtures, not these production consumers.

## Judgment

Adopt the shared positioning and keyboard/selection foundations selectively. Do not wholesale replace both applications' controls: **both now already use native popovers and native dialogs**, and Nila has a reasonably centralized searchable-list layer. The strongest payoff is removing repeated geometry/navigation code while keeping application data, routes, formatting and visual components intact.

| Priority | Application target | Lab foundation | Decision |
| --- | --- | --- | --- |
| 1 | Kaguya anchored disclosure geometry | Anchor positioning | First integration |
| 2 | Kaguya VN selection search | Combobox | Integrate one selection consumer |
| 3 | Kaguya actual in-page tabs | Tabs | Fix semantics and keyboard behavior |
| 4 | Nila action menus | Menu + positioning | Pilot one action menu |
| 5 | Nila searchable ledger/client choices | Combobox | Reuse existing domain search; compare keyboard contract |
| 6 | Nila quantity/amount inputs | NumberField | Pilot quantity first; preserve Decimal boundary |
| Later | Both dialogs, cover tooltips, calendars | Partial overlap | Keep existing behavior until a concrete gain |

## 1. Kaguya positioning: strongest immediate replacement

`D:/kaguya/assets/js/hooks/anchored_popover.js:17` contains `placePanel`, a hand-written placement/flip/clamp algorithm. It measures window.innerWidth/innerHeight, chooses an opposite side only if it fully fits, then clamps coordinates. It does not provide available-width/height sizing; a panel larger than the viewport cannot be made to fit merely by moving its origin. This is source evidence of a limitation; this audit did not reproduce a new browser failure.

`D:/kaguya/lib/kaguya_web/components/ui/menu.ex:1` already deliberately implements a native disclosure rather than an ARIA menu. Keep its native top-layer DOM ownership and HEEx styling. Replace the positioning part with the lab's mapped Floating UI middleware/autoUpdate, wire maximum dimensions to the available-size properties, and preserve match-width, align offset, item-dismiss and update cleanup.

Consumers include `components/comments/comment_components.ex:344`, `components/vn/sidebar.ex:289`, `components/lists/form_components.ex:244`, `components/discussions/post_actions_menu.ex:51`, and `live/members_live/index.ex:119`. Mixed form/filter content should remain a disclosure/popover. Only action-only content should acquire Menu keyboard semantics; applying role=menu universally would be a regression. Existing menuitemradio usages require a coherent containing menu or ordinary form-control semantics.

## 2. Kaguya search: replace interaction, not its remote pipeline

`D:/kaguya/assets/js/hooks/vn_search.js:33` handles Escape and Enter but does not implement arrow-highlight selection. Enter goes to search. The same hook already has AbortController and monotonically increasing request checks at lines224–238; do not claim the application lacks stale-result protection. Shared surfaces are rendered by `D:/kaguya/lib/kaguya_web/components/shared/search.ex:24` (navbar), `:111` (selection) and `:181` (compact search). List editing uses `components/lists/form_components.ex:330`; navbar uses `components/app_navbar.ex:424`.

Pilot **selection search** first: add active-descendant navigation, disabled handling and accepted-value/query separation, retaining result cards, IDs, images, selection events and server search. Navbar search is partly navigation, with Enter intentionally visiting a results page; its Enter behavior needs a product decision rather than copying a select fixture. Preserve `/search/visual-novels`, recent-search handling and LiveView navigation. The lab's asynchronous proposal bridge is an adapter extension, not a replacement for application authorization or API querying.

`assets/js/hooks/relation_search.js` and profile favorites search should follow only after the shared selection contract fits. Empty/results/loading/error UX and selected entity restoration must be connected to actual app data before deleting their existing hooks.

## 3. Kaguya tabs: small, concrete semantic improvement

`D:/kaguya/lib/kaguya_web/components/shared/segmented_control.ex:31` renders role=tablist and role=tab/aria-selected, but no roving tabindex, arrow handler or aria-controls relationships. The lab Tabs navigation can supply these **when the content is an actual in-page panel**. `components/home/feed_components.ex:46` is a concrete consumer to classify.

If a segment is instead an operational filter, ordinary pressed buttons or a single-choice control can be more accurate than tabs. Lab ToggleGroup allows clearing every option, whereas the site's filter may require one selected value; enforce the application invariant or keep the existing selected-button pattern. URL navigation tabs should remain links with patch/navigate behavior, not button tabs.

## 4. Nila menus: existing baseline is materially better than “broken dropdown”

`D:/nila/lib/nila_web/components/menu.ex:1` already centralizes native popover menus. The colocated ActionMenuPopover opens first/last from ArrowDown/Up, handles arrows/Home/End/Escape/Tab, restores trigger focus and uses native top-layer dismissal. Its `positionMenu` around line139 still maintains its own viewport placement. The lab offers richer typeahead and a shared positioning/cleanup implementation, but adopting it is a consolidation and feature improvement, not proof the current component is unusable.

Preserve submit-button `form/name/value`, `phx-target`, destructive styling and existing event ownership. A lab item action fixture does not automatically cover those form submits. Pilot one menu before replacing this shared component.

## 5. Nila searchable selection: useful existing semantics must survive

`D:/nila/assets/js/hooks/selectable_list.js` already separates active and selected state, maintains aria-activedescendant, exposes arrows/first/last, preserves a stable option ID, and supports pointer highlight. `D:/nila/lib/nila_web/components/selectable_list.ex` supplies native popover panels and the semantic listbox/options. This is not equivalent to Kaguya's simpler VN search interaction.

Concrete consumers: `D:/nila/lib/nila_web/components/ledger_picker.ex:96`, `live/client_switcher_component.ex:126`, and `live/banking/statement_live.ex:2172`. Reuse the lab input lifecycle/navigation only after matching Nila's loop/clamp, first-active and Enter fallback behavior deliberately. Keep Tally ledger lookup, client switching permissions, option rows and server filtering. The existing CSS anchor positioning around selectable_list.ex:155 can remain where adequate; shared Floating UI is an alternative, not a mandatory migration.

## 6. NumberField: valuable for Nila, with a real numeric boundary

`D:/nila/lib/nila_web/live/gst/sales_bills_live.ex:4614` onward includes numeric editing fields; amount entry around lines4528–4540 uses decimal input mode. `D:/nila/lib/nila_web/components/input.ex:355` explicitly serializes Decimal values, and sales_bills_live.ex:2235 validates through Money.decimal_or_error. Preserve these decimal-string/server boundaries. The mapped Base UI NumberField uses JavaScript numbers: adopting it must not silently replace exact financial values with floating-point values.

A quantity/percentage field is the safer first integration: visible locale formatting, partial text, canonical value, clamp/step, read-only/disabled and untouched-blur precision are useful. For money, define serialization and rounding with the existing Money/Decimal context before adopting. Keep submission names, changeset validation and errors; test one real form submission, not merely the lab output label.

## Components that should not move simply because a lab fixture exists

- **Dialogs:** Kaguya `assets/js/lib/dialog_controller.js` and `components/ui/dialog.ex`, and Nila `assets/js/hooks/modal.js` / `components/modal.ex`, already use showModal. Nila handles nested destruction and patch ordering. Lab Dialog can eventually unify policy/cancellation, but cannot be assumed more complete than those application lifecycles. Preserve gallery/cropper custom initial focus and unsaved-change behavior.
- **Cover tooltips:** Kaguya `assets/js/hooks/cover_tooltip.js` has delegated cover-grid lookup, pointer tracking, warm delays and scroll behavior. The lab Tooltip is a single-trigger, non-hoverable bounded implementation and does not replace that wholesale. It is suitable for simple Help buttons first. Its role/description wiring is an explicit improvement over the pinned upstream Tooltip omission.
- **Dates:** Kaguya `components/shared/date_range_picker.ex` and `live/vn_live/show/components.ex:97`; Nila `components/input.ex:245` uses a DD/MM/YYYY text mask plus ISO hidden value. No lab DatePicker/Calendar has been ported. NumberField is not a substitute; leave dates out of an adoption claim.
- **Navigation and filter segments:** Nila `components/button.ex:110` uses pressed operational-filter buttons, while its navigation_tabs below uses URL-backed links. Preserve those distinctions. ToggleGroup's ability to clear all selections is not automatically desired.
- **Ratings/ranges:** Kaguya RatingStars, StatusSegments and browse range controls carry application-specific meaning. Native range/input controls should remain unless the lab provides a demonstrable missing behavior; no need to manufacture replacement infrastructure.

## Adoption gate

Ship a small reusable primitive package/component API before copying fixture files into applications. For each first consumer preserve styling, event payloads, form serialization, client/server ownership and navigation. Verify its ordinary keyboard path, selection/submission, reopen and one LiveView update while open. Delete the replaced application hook only after the real consumer works. Do not add large test matrices or migrate every family just to increase coverage counts.
