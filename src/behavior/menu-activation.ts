/**
 * Single non-native, non-link menuitem branch from Base UI useButton.ts:116–175
 * and useMenuItemCommonProps.ts:64–68, pin4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
export function activateMenuItemKey(
  state: {disabled: boolean; typing: boolean; isCurrentTarget: boolean},
  event: {key: string; defaultPrevented: boolean; preventDefault(): void},
  click: () => void,
): boolean {
  // Common item handler runs before the button handler. Space during a
  // typeahead session is text input, and must not activate the highlighted row.
  if (event.key === ' ' && state.typing) event.preventDefault();
  if (state.disabled || !state.isCurrentTarget) return false;
  if (event.key !== ' ' && event.key !== 'Enter') return false;
  if (event.defaultPrevented) return false;
  event.preventDefault();
  click();
  return true;
}
