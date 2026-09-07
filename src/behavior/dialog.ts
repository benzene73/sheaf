/**
 * Base UI DialogStore.setOpen and DialogInteractions decision extraction.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';
import { contains, getTarget } from './shadow-dom';

export type DialogModality = boolean | 'trap-focus';
export function getDialogConfiguration(open: boolean, modal: DialogModality = true,
  disablePointerDismissal = false, nestedOpenDialogs = 0) {
  return { trapFocus: modal !== false, lockScroll: open && modal === true,
    closeOnFocusOut: !disablePointerDismissal, escapeKey: nestedOpenDialogs === 0 };
}
export function getDialogOutsidePressMode(modal: DialogModality, hasBackdrop: boolean) {
  return hasBackdrop ? 'intentional' as const
    : { mouse: modal === 'trap-focus' ? 'sloppy' as const : 'intentional' as const, touch: 'sloppy' as const };
}

/** Invoked only after useDismiss's press/inside-tree guards, not for every pointer event. */
export function acceptsDialogOutsidePress(event: MouseEvent | PointerEvent | TouchEvent, state: {
  outsidePressEnabled: boolean; topmost: boolean; disablePointerDismissal: boolean;
  modal: DialogModality; internalBackdrop: Element | null; backdrop: Element | null; popup: Element | null;
}) {
  if (!state.outsidePressEnabled) return false;
  if ('button' in event && event.button !== 0) return false;
  if ('touches' in event) {
    if (event.type === 'touchend') {
      if (event.changedTouches.length !== 1 || event.touches.length !== 0) return false;
    } else if (event.touches.length !== 1) return false;
  }
  const target = getTarget(event) as Element | null;
  if (state.topmost && !state.disablePointerDismissal) {
    if (state.modal) {
      return state.internalBackdrop || state.backdrop
        ? state.internalBackdrop === target || state.backdrop === target ||
          (contains(target, state.popup) && !target?.hasAttribute('data-base-ui-portal'))
        : true;
    }
    return true;
  }
  return false;
}

export type DialogChangeDetails = ChangeEventDetails & { preventUnmountOnClose(): void };
/** useDismiss:204–232; native dialog `cancel` bridging is a separate adapter concern. */
export function runDialogEscapeKey(event: KeyboardEvent, state: {
  open: boolean; enabled: boolean; escapeKey: boolean; composing: boolean;
  bubbles: boolean; blockingChild: boolean;
}, requestClose: (details: ChangeEventDetails) => void) {
  if (!state.open || !state.enabled || !state.escapeKey || event.key !== 'Escape') return;
  if (state.composing || (!state.bubbles && state.blockingChild)) return;
  const details = createChangeEventDetails('escape-key', event);
  requestClose(details);
  if (!details.isCanceled) event.preventDefault();
  if (!state.bubbles && !details.isPropagationAllowed) event.stopPropagation();
}
/** Effects preserve source order; updateOpen receives the possibly callback-mutated trigger. */
export function requestDialogOpen(nextOpen: boolean, details: ChangeEventDetails, state: {
  activeTriggerId: string | null; activeTriggerElement: Element | null;
}, effects: {
  preventUnmount(): void;
  onOpenChange?(open: boolean, details: DialogChangeDetails): void;
  dispatchOpenChange(open: boolean, details: DialogChangeDetails): void;
  updateOpen(open: boolean, trigger: Element | undefined): void;
}) {
  const dialogDetails = details as DialogChangeDetails;
  dialogDetails.preventUnmountOnClose = () => effects.preventUnmount();
  if (!nextOpen && details.trigger == null && state.activeTriggerId != null) {
    details.trigger = state.activeTriggerElement ?? undefined;
  }
  effects.onOpenChange?.(nextOpen, dialogDetails);
  if (details.isCanceled) return;
  effects.dispatchOpenChange(nextOpen, dialogDetails);
  effects.updateOpen(nextOpen, details.trigger);
}
