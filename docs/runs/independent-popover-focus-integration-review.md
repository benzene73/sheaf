# Independent Popover focus integration review

Inspected NativePositionedPopover, shared NativePopupController, source-translated popover-focus functions and actual pinned FloatingFocusManager. The adapter now delegates initial/default target selection and race checks to the mapped functions, uses generation/dead/open checks to avoid late work after closing or destruction, and disables the controller's generic return-focus branch so there is one owner. Touch default focus goes to the popup; ordinary default focus uses source tabbable discovery.

## Source ordering finding

Upstream FloatingFocusManager cleanup captures activeEl and inside-floating-tree membership before queuing its return-focus microtask, then discovers the target's first tabbable element within that microtask. At inspection, the adapter reverses those phases: target discovery happens before, active/focus membership after. The policies agree for ordinary steady-state fixtures but are not the same under DOM/focus changes between phases. Reported to implementation owner to align source ordering or explicitly document a native lifecycle substitution.

Other boundaries are explicit: closeType is currently an empty string, prevented=false, and previous-focus history fallback returns null. Thus keyboard focusVisible, outside-press preventScroll detection, nested focus-tree membership, arbitrary fallback history, and custom focus policies are not implemented by this host. It also does not implement focus-out dismissal. Source helpers offering those policies do not imply their integration into the host.

Destroy invalidates pending focus work and disposes the controller; no unmount-return-focus claim is made. Actual native top-layer timing differs from React mounting, so paired tests remain necessary even with matching source functions. This review does not upgrade six happy-path tests into a complete FloatingFocusManager port.
