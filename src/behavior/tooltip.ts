/**
 * TooltipTrigger delay resolution and single-reference focus/rest-hover extraction.
 * Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';
import type { TypeaheadTimer } from './menu-typeahead';
export const TOOLTIP_OPEN_DELAY = 600;
export const TOOLTIP_PROVIDER_TIMEOUT = 400;
export function getTooltipOpenDelay(delay?: number, providerDelay?: number, providerActive = false) {
  return providerActive ? 0 : delay ?? providerDelay ?? TOOLTIP_OPEN_DELAY;
}
/** useFocus: DOM/tree facts are supplied by host at event time / after zero-timeout. */
export function createTooltipFocus(options: {
  requestOpen(open: boolean, details: ChangeEventDetails): void;
  timer: TypeaheadTimer;
}) {
  let blocked = false, blockedReference: Element | null = null;
  const reset = () => { blocked = false; blockedReference = null; };
  return {
    openChanged(reason: string, reference: Element) {
      if (reason === 'trigger-press' || reason === 'escape-key') { blocked = true; blockedReference = reference; }
    },
    windowBlur(reference: Element, open: boolean, referenceFocused: boolean) {
      if (!open && referenceFocused) { blocked = true; blockedReference = reference; }
    },
    mouseLeave: reset,
    focus(event: Event, reference: Element, focusVisible: boolean) {
      if (blocked) { if (blockedReference === reference) return; reset(); }
      if (!focusVisible) return;
      options.requestOpen(true, createChangeEventDetails('trigger-focus', event, reference));
    },
    blur(event: Event, getFacts: () => {
      relatedTargetMissing: boolean; activeIsReference: boolean; activeInsideFloating: boolean;
      activeInsideReference: boolean; movedToFocusGuard: boolean; nextInsideEnabledTrigger: boolean;
    }) {
      reset();
      options.timer.start(0, () => {
        const facts = getFacts();
        if ((!facts.relatedTargetMissing || !facts.activeIsReference) && !facts.activeInsideFloating &&
          !facts.activeInsideReference && !facts.movedToFocusGuard && !facts.nextInsideEnabledTrigger) {
          options.requestOpen(false, createChangeEventDetails('trigger-focus', event));
        }
      });
    },
    destroy() { options.timer.clear(); reset(); },
  };
}
/** useHoverReferenceInteraction mousemove rest branch; no nested/multi-trigger/grace polygon. */
export function createTooltipHoverRest(options: {
  getState(): { open: boolean; pointerType?: string; restMs: number; clickLikeOpen: boolean;
    blockMouseMove: boolean; shouldOpen: boolean };
  timer: TypeaheadTimer; requestOpen(details: ChangeEventDetails): void;
}) {
  let pending = false;
  return {
    move(event: MouseEvent, trigger: Element) {
      const state = options.getState();
      if (!['mouse', 'pen', '', undefined].includes(state.pointerType)) return;
      if (state.open || state.restMs === 0) return;
      if (pending && event.movementX ** 2 + event.movementY ** 2 < 2) return;
      options.timer.clear();
      pending = true;
      options.timer.start(state.restMs, () => {
        pending = false;
        const current = options.getState();
        if (current.clickLikeOpen) return;
        if (!current.blockMouseMove && !current.open && current.shouldOpen) {
          options.requestOpen(createChangeEventDetails('trigger-hover', event, trigger));
        }
      });
    },
    clear() { options.timer.clear(); pending = false; },
  };
}
