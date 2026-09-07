# Accordion

Pinned Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

- `accordion/root/AccordionRoot.tsx`: `handleValueChange` single/multiple branches, notification before cancellation check and assignment.
- `accordion/item/AccordionItem.tsx`: item notification/cancellation before root request.
- `collapsible/root/useCollapsibleRoot.ts`: trigger toggles current open value with `trigger-press` details.
- `accordion/trigger/AccordionTrigger.tsx`: native button, disabled-but-focusable semantics, expanded/controls relationship. Native Enter/Space activation avoids another custom keyboard implementation.
- `accordion/panel/AccordionPanel.tsx`: region with trigger label.

The pinned source has deprecated orientation/loopFocus and no longer implements roving focus; this adapter likewise uses normal Tab order.

Host adaptation: required stable IDs/string values, delegated click handler with nested-root ownership check, kept-mounted hidden panels, no animation, no hidden-until-found. Browser owns expansion; LiveView observes `accordion_change` with component ID and values. Unrelated patches reapply that state. External controlled values, dynamic removal reconciliation, and full Collapsible transition behavior are not ported. The fixture uses single-open mode; the pure source function also retains multiple-open behavior.
