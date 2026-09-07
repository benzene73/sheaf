# Dialog policy slice

Source pin `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`, MIT notice in `src/behavior/dialog.ts` and license file.

`DialogStore.ts:74–98` is translated by `requestDialogOpen`: attach preventUnmountOnClose; retain active trigger on closing when missing; call onOpenChange; return if canceled; dispatch the floating open-change event; update popup state using the possibly modified trigger. The host owns popup-state updates and mounting; preventUnmount can take effect even when the request is subsequently canceled, as in the source.

`DialogInteractions` in `root/useDialogRoot.ts:29–95` supplies default topmost dismissal and scroll policies. Backdrop presence makes all outside presses intentional. Without one, mouse is intentional (sloppy for trap-focus), touch sloppy. The extracted predicate rejects secondary mouse buttons and multi-touch, requires the topmost dialog and pointer dismissal enabled, and checks this dialog's owning backdrop. This predicate runs after useDismiss's press lifecycle/inside-tree/scrollbar checks; it is not itself a complete pointer gesture recognizer.

`useDismiss.ts:204–232` becomes `runDialogEscapeKey`: guard open/enabled/Escape/composition/blocking descendants; request close with escape-key reason; prevent default only when accepted; stop propagation unless bubbling or explicitly allowed, including canceled requests. A native dialog adapter must prevent the browser's cancel default and route through controlled state. That browser bridge differs from the source keydown API and must not be advertised as a literal event implementation.

Defaults are modal=true, disablePointerDismissal=false (`DialogStore.ts:123`). Scroll locking is only open && modal===true. Focus trapping is modal!==false; unlike Popover it does not depend on a Close component. Pointer dismissal disabled also disables nonmodal close-on-focus-out, but never disables Escape. `DialogPopup.tsx:98–106` shares the already extracted initial/final focus policies, default touch-popup focus and restoreFocus="popup".

Native showModal supplies top layer, background inertness and core focus behavior. The source does not use native dialog, so its focus guards, shared focus history, pointer lifecycle and animations are not automatically equivalent. This slice intentionally excludes full FloatingFocusManager/useDismiss trees and Drawer behavior. Seven unit tests verify ordinary defaults, own-backdrop safety, cancellation/ordering and Escape propagation; the independent Chromium fixture verifies everyday open/close workflows.
