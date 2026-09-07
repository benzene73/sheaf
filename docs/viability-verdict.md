# Viability verdict

**The experiment supports building a useful LiveView primitive library from pinned Base UI behavior. It does not establish that we have ported Base UI, or that the current library is ready to replace every production control.** The practical result is stronger than an independent imitation: source decisions, callback ordering and selected algorithms were translated, and independent browser fixtures exposed incorrect assumptions before they became the contract.

## What was demonstrated

Ten families have bounded implementations and fixtures: Combobox, Menu, Select, Popover, Dialog, NumberField, Tabs, Tooltip, Accordion and ToggleGroup. Coverage is unequal. Shared navigation, locale filtering, numeric parsing/validation, positioning middleware, scroll locking, tabbable traversal, focus decisions and event cancellation are valuable foundations across those families. Per-family mapping documents record source paths and omissions at Base UI commit `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

Examples of source-derived behavior that an independent rewrite could easily miss:

- Combobox cancellation prevents closing; Select item cancellation can leave the old value while still closing because its close details are fresh.
- Disabled items are not uniformly skipped. Several consumers deliberately allow disabled highlight/focus while rejecting activation; native-disabled Toggle buttons are different.
- Tabs defaults to manual activation; opening a NumberField's empty value by stepping seeds zero and then clamps, rather than adding the first step.
- Tooltip's default hover wait is a rest delay, not a simple mouseenter delay. Popover's touch initial focus deliberately avoids opening a virtual keyboard.
- Untouched formatted NumberField text must not be reparsed into a less precise authoritative number on blur.

These findings justify source inspection and independent oracles. They do not justify blindly adopting every upstream choice. The pinned Tooltip implementation lacked role/description wiring in the exercised fixture; the LiveView host explicitly adds it as an accessibility improvement rather than falsely claiming identical markup.

## What remains ours

The source utility layer is only part of the system. We still own LiveView hooks, DOM part contracts, stable IDs, event payloads, client/server state ownership, patch reconciliation, cleanup, accepted-value versus query representation, native top-layer integration and component composition. The asynchronous LiveView proposal bridge is a new integration protocol, not a React-source feature.

Native dialog/popover substitutions remove some browser plumbing, but they do not make every FloatingFocusManager/useDismiss behavior equivalent. Focus history, portal guards, nested ownership, hover transit, animations, controlled updates and event timing still require explicit decisions. Several adapters intentionally expose only ordinary supported configurations; a public API must not advertise an omitted variant just because the upstream component supports it.

There is useful early composition evidence: an actual public Select inside a public Dialog survives child Escape, selection patches and form Save while preserving the parent dialog, then restores trigger focus on Close. This is more relevant to adoption than counting another hundred isolated assertions. It still says nothing universal about arbitrary nested trees.

## Comparison with the Bun migration analogy

The transferable lesson from the user's Bun example is **preserve a known behavioral contract, document translation rules, run an independent oracle, and review adversarially**. Compute makes repeated source inspection, implementation and feedback loops affordable. Our negative controls and corrected upstream assumptions are evidence that this method can detect more than happy-path agreement.

The analogy has an important limit. A language migration can preserve the runtime's public interface and execute an existing language-independent suite. React to LiveView changes ownership and timing: synchronous callbacks and React effects become browser hooks plus server patches, while portals may become native top-layer elements. A significant part is platform integration and API design, not mechanical syntax conversion. The user-provided Bun speed/size figures are not independently verified by this experiment and are not a forecast for this project.

Therefore “we have compute” is a good reason to attempt this work, but not a reason to estimate completion by upstream line count. More parallel agents help when ownership is separated into source extraction, host integration and independent fixtures. They help less when several agents edit the same lifecycle or keep extending tests without a new product requirement.

## Next stage

Freeze the supported contracts and package the public components/hooks coherently. Then adopt one real Kaguya anchored disclosure and one selection control, preserving styling, routes, event payloads and remote search. For Nila, pilot a menu or quantity input; keep its existing Decimal/server money boundary intact. See `adoption.md` for exact application paths and limitations.

For each integration, verify ordinary keyboard use, disabled/read-only behavior, selection or form submission, reopen, and one relevant LiveView patch. Add a test when a real requirement or defect calls for it. Do not make a giant compatibility matrix a prerequisite for every small control, and do not declare production readiness from isolated fixtures alone.

The success criterion is a simpler application with fewer independently maintained interaction implementations. If adopting a primitive requires preserving the old hook beside a large new compatibility wrapper, narrow or redesign the primitive before expanding to the next consumer. This library is viable if it reduces that burden; source lineage by itself is not the product.
