# Independent native Dialog practical review

Inspected PortedDialog, source dialog policy functions and DialogLive fixture. No practical blocker found in the declared kept-mounted native-modal contract. This is a source review; the shared Chromium scenarios are the browser acceptance gate.

The adapter lets showModal own top-layer rendering, background inertness and native focus behavior. It cancels the browser cancel event before applying source callback cancellation, so Escape cannot silently bypass the requested cancellation policy. Close controls are type=button; Save is an explicit submit. The fixture ignores the native open attribute during LiveView patching, and Save changes only output assigns, so ordinary successful Save does not request close or remove the form. Scroll ownership uses the counted lease with cleanup on close and destruction. Component identity is included in notifications.

The mapped request function preserves callback cancellation before state update. The adapter's rectangular outside pointer guard is an explicit native-backdrop integration replacement, not a claim that all useDismiss pointer machinery was translated.

A relevant boundary for future product integration: native method=dialog or external dialog.close() is observed after closure and therefore bypasses the cancelClose request policy. The source comment makes this explicit and the fixture does not use method=dialog. Do not market that flag as a universal unsaved-data guard. Server validation and deciding when Save should close are application responsibilities, not supplied by these notifications.

No additional edge-case matrix recommended now. Complete the shared everyday Chromium gate and move to the next component.
