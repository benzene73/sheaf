# Popover focus policy extraction

Pinned Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`; MIT attribution in module and `licenses/BASE-UI-MIT.txt`.

## Source contract

`PopoverRoot.tsx:34` defaults `modal=false`. `PopoverPopup.tsx:68–75,108–121` supplies default initial-focus resolver, enables focus trapping only when `modal !== false && hasClosePart`, disables the focus manager while unmounted or opened by trigger hover, defaults final focus through FloatingFocusManager, sets restoreFocus="popup", and supplies trigger focus neighbors. Root modality is therefore not equivalent to focus-manager modality.

`utils/popups/popupStoreUtils.ts:42` returns the popup for touch and true otherwise. This avoids activating the mobile virtual keyboard. `FloatingFocusManager.tsx:664–737` resolves initial focus in a microtask, skips when focus was already inside, defaults to first tabbable or popup, and checks the open/focus state again in the queued animation frame. Callback undefined means no focus; callback null or an empty ref means default. The extraction preserves that distinction and ordering.

`FloatingFocusManager.tsx:748–888` selects a connected trigger or previously focused element (excluding body); explicit null opening interaction prefers previous focus, whereas an empty interaction string does not. It falls back to shared focus history. Cleanup uses the first tabbable return element and respects focus that has moved outside unless finalFocus is explicit. Focus options are preventScroll=true and additionally focusVisible=true for keyboard closure. Outside-press prevention is cleared for nested/virtual events; ordinary pointer events probe preventScroll support. Hover mouseleave prevents return. Focus-out sets prevention separately around lines 550–551.

`PopoverRoot.tsx:236–243` chooses intentional mouse outside press, sloppy touch outside press, and sloppy mouse for trap-focus. Native light dismissal is not a substitute for these pointer lifecycle rules. Nested tree ownership, cancellation and Escape propagation require the dismissal layer, not these focus helpers.

## Port boundary and host obligations

`src/behavior/popover-focus.ts` extracts target resolution, modality/enablement, queued initial focus guard, return eligibility and open-change return-prevention decisions. It does **not** reimplement FloatingFocusManager. The host must supply shadow-aware containment, tabbable enumeration (including radio groups/visibility/disabled rules), first-tabbable return-target resolution, current floating-tree membership, shared focus history, event modality/virtual-event classification and the browser preventScroll probe. It must capture the pre-open active element, queue the initial microtask/rAF in source order, check current open state at execution, and capture return-target/active-tree facts before the cleanup microtask.

Still absent from this unit: focus guards and portal tab order, removal/display-none recovery (`restoreFocus="popup"`), nested floating-tree traversal, aria hiding/marker ownership, full modal trapping, intentional/sloppy press detection, event cancellation, scheduling lifecycle, and touch-device validation. Those omissions must not be described as full Popover parity.

## Test mapping

Upstream `popover/popup/PopoverPopup.test.tsx`: default first focus73; explicit ref103; callback140/178; latest interaction223; false258; true284; null309; lost focused element335 (not ported); default final focus415; explicit final448/490; false524. Ten extraction units exercise these decision branches plus queued-close races, outside-focus respect, and disconnected fallback. Browser tests belong to the independent paired harness; passing these unit tests alone does not certify DOM or native-popover equivalence.
