# Independent accessibility modality audit

## Judgment

Do not add aria-hidden/inert outside ordinary Menu or Select merely because their root modal option is true. The actual pinned Base UI consumers deliberately distinguish pointer/scroll modality from focus-manager modality. This audit disproved the suspected blanket accessibility-isolation mismatch for these two fixtures.

`MenuPopup.tsx:123-141` supplies `FloatingFocusManager modal={isContextMenu}`: ordinary Menu is nonmodal at this layer. `SelectPopup.tsx:481-490` supplies `modal={false}`. `FloatingFocusManager.tsx:600-664` conditionally applies aria-hidden only for focus-manager modal or untrapped typeable combobox; it separately applies an internal marker. Root modal alone does not satisfy that condition.

## Executable evidence

`harness/a11y-modality.mjs` drives the actual pinned upstream React server on 4198 and LiveView on 4197. Two families, root modal true/false, both implementations, three engines produce 24 observations. It opens with ArrowDown, waits for actual option/menuitem focus, inspects an existing Outside button and an unrelated background heading/control appended before opening, then closes with Escape and checks restoration.

Both implementations keep the outside button and unrelated heading discoverable through Playwright's default accessible-role queries in every mode. No aria-hidden/inert ancestor hides them. Upstream additionally places data-base-ui-inert on the unrelated section and removes it on close; this custom marker is not HTML inert and does not itself suppress accessibility. LiveView omits that marker because it does not use upstream's marker-consuming focus/dismiss machinery. The probe records this intentional implementation difference instead of pretending identical DOM.

Artifact: `artifacts/a11y-modality.json`. This is DOM/role-exposure evidence, not a screen-reader session or physical assistive-technology certification. An initial run encountered one server restart; the completed rerun replaces that inconclusive artifact.

## When an isolation effect would be needed

For genuinely modal Popover/ContextMenu or a focus-manager consumer that actually requests isolation, the smallest faithful source unit is markOthers.ts with its real call-site inside-elements policy. Preserve ancestor/shadow-host correction, nested portal/guard exclusions, aria-live exemptions, independent aria-hidden/inert counters, existing author-owned hidden state, and cleanup on close/destroy. A blanket body-children inert loop is a different behavior: it changes focus/Tab, misses nested ownership and can hide permitted announcements.

The shared native popup controller must not equate root modal with accessibility isolation. Native popover top-layer behavior supplies neither modal inertness nor the complete React focus-manager contract. Native dialog showModal supplies a different platform modal contract. MarkOthers itself is a snapshot walk, not an arbitrary dynamic-LiveView-subtree reconciliation system; if later adopted, explicitly test patch/reentrant/nested ownership and idempotent host cleanup rather than inventing guarantees.
