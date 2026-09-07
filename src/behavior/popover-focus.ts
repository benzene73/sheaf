/**
 * Bounded extraction from Base UI PopoverPopup and FloatingFocusManager.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import type { FocusableElement } from './tabbable';
export type InteractionType = '' | 'mouse' | 'touch' | 'pen' | 'keyboard';
type FocusResult = boolean | HTMLElement | { current: HTMLElement | null } | null | void;
export type FocusPolicy = boolean | { current: HTMLElement | null } | ((type: InteractionType) => FocusResult);
function resolveRef(value: HTMLElement | { current: HTMLElement | null }) {
  return 'current' in value ? value.current : value;
}

/** PopoverPopup's default resolver; touch must avoid opening an input keyboard. */
export function defaultPopoverInitialFocus(popup: HTMLElement, type: InteractionType): FocusResult {
  return type === 'touch' ? popup : true;
}

export function getPopoverFocusConfiguration(modal: boolean | 'trap-focus', hasClosePart: boolean,
  mounted: boolean, openReason: string) {
  return { modal: modal !== false && hasClosePart, disabled: !mounted || openReason === 'trigger-hover' };
}

/** Call in a microtask after tabindex updates, with the pre-open active element. */
export function resolvePopoverInitialFocus(options: {
  popup: HTMLElement; policy?: FocusPolicy; interactionType: InteractionType;
  previouslyFocused: Element | null; contains(parent: HTMLElement, child: Element | null): boolean;
  getTabbableContent(popup: HTMLElement): FocusableElement[];
}): FocusableElement | null {
  const { popup, policy, interactionType, previouslyFocused, contains, getTabbableContent } = options;
  const resolved = policy === undefined ? defaultPopoverInitialFocus(popup, interactionType)
    : typeof policy === 'function' ? policy(interactionType) : policy;
  if (resolved === undefined || resolved === false) return null;
  if (contains(popup, previouslyFocused)) return null;
  const getDefault = () => getTabbableContent(popup)[0] || popup;
  if (resolved === true || resolved === null) return getDefault();
  return resolveRef(resolved) || getDefault();
}

/** FloatingFocusManager's next-frame race guard; do not steal later intentional focus. */
export function shouldRunInitialFocus(options: {
  open: boolean; hadFocusInside: boolean; currentActive: Element | null;
  target: FocusableElement; focusCurrentlyInside: boolean;
}) {
  if (!options.open) return false;
  if (options.hadFocusInside) return true;
  return !(options.currentActive !== options.target && options.focusCurrentlyInside);
}

/** Resolve before queuing cleanup's microtask; null/empty refs mean default, void means none. */
export function resolvePopoverReturnFocus(options: {
  policy?: FocusPolicy; closeType: InteractionType; openInteractionType: InteractionType | null;
  reference: HTMLElement | null; previouslyFocused: HTMLElement | null;
  getPreviousFocus(): HTMLElement | null;
}): HTMLElement | null {
  const { policy = true, closeType, reference, previouslyFocused, openInteractionType } = options;
  let resolved = typeof policy === 'function' ? policy(closeType) : policy;
  if (resolved === undefined || resolved === false) return null;
  if (resolved === null) resolved = true;
  const referenceReturn = reference?.isConnected ? reference : null;
  const previousReturn = previouslyFocused?.isConnected && previouslyFocused.nodeName.toLowerCase() !== 'body'
    ? previouslyFocused : null;
  const fallback = (openInteractionType == null ? previousReturn || referenceReturn : referenceReturn || previousReturn)
    || options.getPreviousFocus();
  return typeof resolved === 'boolean' ? fallback : resolveRef(resolved) || fallback || null;
}

/** Host resolves first tabbable target and captures inside-tree membership before cleanup. */
export function shouldReturnPopoverFocus(options: {
  policy?: FocusPolicy; prevented: boolean; target: HTMLElement | null;
  activeElement: Element | null; body: HTMLElement; focusInsideTree: boolean;
}) {
  const { policy = true, prevented, target, activeElement, body, focusInsideTree } = options;
  const explicit = typeof policy !== 'boolean';
  return Boolean(policy && !prevented && target &&
    (!explicit && target !== activeElement && activeElement !== body ? focusInsideTree : true));
}

/** Open-change event branch only; focus-out prevention is set separately by the host. */
export function updatePreventReturnFocus(previous: boolean, details: {
  reason: string; nativeEventType: string; nested: boolean; virtualEvent: boolean;
  supportsPreventScroll(): boolean;
}) {
  if (details.reason === 'trigger-hover' && details.nativeEventType === 'mouseleave') return true;
  if (details.reason !== 'outside-press') return previous;
  if (details.nested || details.virtualEvent) return false;
  return !details.supportsPreventScroll();
}
