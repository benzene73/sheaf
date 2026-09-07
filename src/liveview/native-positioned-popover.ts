import {NativePopupController} from './native-popup-controller';
import {requirePart, type HookDefinition} from './hook-types';
import {resolvePopoverInitialFocus, shouldRunInitialFocus, resolvePopoverReturnFocus,
  shouldReturnPopoverFocus} from '../behavior/popover-focus';
import {tabbable, getFirstTabbableElement} from '../behavior/tabbable';
import {activeElement, contains} from '../behavior/shadow-dom';

interface State { controller: NativePopupController; focusGeneration: number; dead: boolean; }
// Native top-layer lifecycle substitutes for the portal; the position policy is
// source translated and shared with menus/selects through one controller.
export const NativePositionedPopover: HookDefinition<State, {}> = {
  mounted() {
    this.focusGeneration = 0; this.dead = false;
    const anchor = requirePart(this.el, '[data-part=anchor]', HTMLButtonElement);
    const floating = requirePart(this.el, '[data-part=positioner]', HTMLElement);
    const layer = requirePart(this.el, '[data-part=layer]', HTMLElement);
    const backdrop = requirePart(this.el, '[data-part=backdrop]', HTMLElement);
    const popup = requirePart(this.el, '[data-part=popup]', HTMLElement);
    let previouslyFocused: HTMLElement | null = null;
    this.controller = new NativePopupController({anchor, layer, popup: floating, backdrop}, {
      modal: () => this.el.dataset.modal === 'true', restoreFocus: false,
      positioning: {positionMethod: 'fixed', side: 'bottom', align: 'center', sideOffset: 8,
        collisionPadding: 12, collisionAvoidance: {fallbackAxisSide: 'none'}},
      onOpen: () => {
        const doc = this.el.ownerDocument;
        const previous = activeElement(doc);
        previouslyFocused = previous instanceof HTMLElement ? previous : null;
        const generation = ++this.focusGeneration;
        queueMicrotask(() => {
          if (this.dead || generation !== this.focusGeneration || !this.controller.open) return;
          const target = resolvePopoverInitialFocus({popup, interactionType: this.controller.interactionType,
            previouslyFocused: previous, contains, getTabbableContent: tabbable});
          if (!target) return;
          const hadFocusInside = contains(popup, activeElement(doc));
          requestAnimationFrame(() => {
            if (this.dead || generation !== this.focusGeneration) return;
            const currentActive = activeElement(doc);
            if (shouldRunInitialFocus({open: this.controller.open, hadFocusInside, currentActive,
              target, focusCurrentlyInside: contains(popup, currentActive)})) {
              target.focus({preventScroll: target === popup});
            }
          });
        });
      },
      onClose: () => {
        const generation = ++this.focusGeneration;
        const resolved = resolvePopoverReturnFocus({closeType: '',
          openInteractionType: this.controller.interactionType,
          reference: anchor, previouslyFocused, getPreviousFocus: () => null});
        const doc = this.el.ownerDocument;
        const active = activeElement(doc);
        const focusInsideTree = contains(popup, active);
        queueMicrotask(() => {
          if (this.dead || generation !== this.focusGeneration || this.controller.open) return;
          const target = resolved ? getFirstTabbableElement(resolved) : null;
          // Upstream final-focus branch explicitly requires HTMLElement.
          if (target instanceof HTMLElement && shouldReturnPopoverFocus({prevented: false,
            target, activeElement: active, body: doc.body, focusInsideTree})) {
            target.focus({preventScroll: true});
          }
        });
      },
    });
    this.el.dataset.fixtureReady = 'true';
  },
  updated() { this.controller.refresh(); },
  destroyed() { this.dead = true; ++this.focusGeneration; this.controller.destroy(); },
};
