/**
 * Composite menuitem branches from Base UI useButton.ts:116–210
 * and useMenuItemCommonProps.ts:64–68, pin4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
export function activateMenuItemKey(
  state: {disabled: boolean; typing: boolean; isCurrentTarget: boolean;
    nativeButton?: boolean; isButton?: boolean; isLink?: boolean},
  event: {key: string; defaultPrevented: boolean; preventDefault(): void},
  click: () => void,
): boolean {
  // Common item handler runs before the button handler. Space during a
  // typeahead session is text input, and must not activate the highlighted row.
  if (event.key === ' ' && state.typing) event.preventDefault();
  if (state.disabled || !state.isCurrentTarget) return false;
  if (event.key === ' ') {
    // All menuitems are composite text-navigation roles. Prevented typeahead Space
    // must not activate. Native mode with a non-button render also never activates.
    if (event.defaultPrevented) return false;
    event.preventDefault();
    if (!state.nativeButton || state.isButton) { click(); return true; }
    return false;
  }
  // Native button/link Enter retains the browser's default submission/navigation.
  if (state.nativeButton || state.isLink || event.key !== 'Enter' || event.defaultPrevented) return false;
  event.preventDefault(); click(); return true;
}

/** Native composite Space was dispatched on keydown; prevent a second native click. */
export function suppressMenuItemKeyUp(state: {
  disabled: boolean; isCurrentTarget: boolean; nativeButton: boolean; isButton: boolean;
}, event: {key: string; preventDefault(): void}) {
  if (!state.disabled && state.isCurrentTarget && state.nativeButton && state.isButton && event.key === ' ') {
    event.preventDefault();
  }
}

/** Source utils/dispatchClickWithModifiers: untrusted click still performs default actions. */
export function dispatchMenuItemClick(target: Element, event: {
  shiftKey: boolean; ctrlKey: boolean; altKey: boolean; metaKey: boolean;
}) {
  const win = target.ownerDocument.defaultView;
  if (!win) return;
  target.dispatchEvent(new win.PointerEvent('click', {
    bubbles: true, cancelable: true, composed: true, detail: 0,
    shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey, metaKey: event.metaKey,
  }));
}
