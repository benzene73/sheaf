# Native menu actions

Pinned Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`. This extends the existing non-native item key helper without changing its default caller behavior.

`useMenuItem.ts` supplies useButton with composite=true and focusableWhenDisabled=true. `useMenuItemCommonProps.ts:64–68` prevents Space during typeahead. `useButton.ts:116–210` preserves native button/link Enter default action, but composite Space dispatches a click **on keydown** and prevents the native button's Space keyup default to avoid duplicate activation. Links likewise use the composite Space path; Enter remains browser navigation. Native mode rendered onto a non-button does not synthesize Space activation.

`activateMenuItemKey` adds optional nativeButton/isButton/isLink facts; legacy defaults remain non-native/non-link. `suppressMenuItemKeyUp` handles the native-button duplicate suppression. `dispatchMenuItemClick` translates dispatchClickWithModifiers with a composed, cancelable PointerEvent click carrying modifiers; browser form-submit/link defaults still run for this synthetic click. It is not enough to call a generic LiveView action event and discard the real submitter/link.

The adapter must retain actual type/form/name/value/href attributes and must not prevent a valid click's default merely to close the menu. Disabled focusable rows require a click preventDefault guard, matching useButton, even where native disabled is absent. Menu item closing comes from the common click handler's close event, independently from the browser default action. Context-menu mouseup/drag gesture handling remains outside this slice.

Three focused units cover native Enter, composite Space/keyup, typeahead, disabled and legacy/link behavior. Independent Chromium fixture checks exercise real form submission/default actions rather than trusting these unit callbacks to prove native behavior.
