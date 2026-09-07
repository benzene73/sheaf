# Tabs core

`tabs.ts` extracts pinned Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`; MIT attribution retained.

TabsList defaults activateOnFocus=false and loopFocus=true, with horizontal orientation from Root. Composite receives disabledIndices=[] and Home/End enabled. TabsTab's useButton uses focusableWhenDisabled=true: disabled tabs may receive arrow focus, but click/focus never activates them. The extracted `runTabsNavigation` follows non-grid button-only `useCompositeRoot.ts:206–315`, reusing source list scans, ignoring modifiers, applying orientation/RTL, and queuing actual focus after highlight in a microtask. Root must supply that microtask instead of synchronously focusing.

`createTabActivation` retains TabsTab.tsx:120–175 active/disabled guards, manual/automatic behavior and primary/secondary pointer focus distinction. Host owns document pointerup/pointercancel listener cleanup. Native buttons provide Enter/Space activation. `requestTabValue` follows Root.tsx:111–125 callback/direction/cancellation ordering; `computeTabDirection` follows Root's geometry and missing-element comparable-value fallback.

Not included: dynamic map reconciliation and implicit selection fallback after tab removal/disable, indicator measurement, overflow scroll adjustment, composite editable descendants, grids, custom onLoop or custom modifier exceptions. The host renders tablist/tab/tabpanel ARIA relationships, selected state, roving tabindex and panel visibility. Four focused units cover navigation, manual activation, pointer focus, and cancellation; the independent Chromium fixture covers everyday component behavior.
