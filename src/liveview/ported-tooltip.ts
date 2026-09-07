import { createTooltipFocus, createTooltipHoverRest, getTooltipOpenDelay } from '../behavior/tooltip';
import { createChangeEventDetails, type ChangeEventDetails } from '../behavior/combobox-input';
import { runDialogEscapeKey } from '../behavior/dialog';
import { startAnchorPositioning } from '../behavior/anchor-positioning';
import { activeElement, contains } from '../behavior/shadow-dom';
import { requirePart, type HookDefinition } from './hook-types';

function timer() {
  let id: ReturnType<typeof setTimeout> | undefined;
  return { start(ms: number, callback: () => void) { clearTimeout(id); id = setTimeout(callback, ms); },
    clear() { clearTimeout(id); id = undefined; } };
}
interface State {
  trigger: HTMLButtonElement; popup: HTMLElement; open: boolean; dead: boolean; pointerType?: string;
  clickLike: boolean; composing: boolean; delay: number; describedByOwned: boolean;
  focusController: ReturnType<typeof createTooltipFocus>;
  hoverController: ReturnType<typeof createTooltipHoverRest>;
  positioning?: ReturnType<typeof startAnchorPositioning>;
  onFocus: (event: FocusEvent) => void; onBlur: (event: FocusEvent) => void;
  onEnter: (event: MouseEvent) => void; onLeave: (event: MouseEvent) => void;
  onMove: (event: MouseEvent) => void; onPointer: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void; onKey: (event: KeyboardEvent) => void;
  onCompositionStart: () => void; onCompositionEnd: () => void;
}
interface Methods { change(open: boolean, details: ChangeEventDetails): void; syncDescription(): void; }
export const PortedTooltip: HookDefinition<State, Methods> = {
  mounted() {
    this.trigger = requirePart(this.el, '[data-tooltip-trigger]', HTMLButtonElement);
    this.popup = requirePart(this.el, '[data-tooltip-popup]', HTMLElement);
    this.describedByOwned = false;
    this.open = false; this.dead = false; this.clickLike = false; this.composing = false;
    this.delay = getTooltipOpenDelay(this.el.dataset.delay === undefined ? undefined : Number(this.el.dataset.delay));
    this.focusController = createTooltipFocus({ timer: timer(), requestOpen: (open, details) => this.change(open, details) });
    this.hoverController = createTooltipHoverRest({ timer: timer(),
      getState: () => ({ open: this.open, pointerType: this.pointerType, restMs: this.delay,
        clickLikeOpen: this.clickLike, blockMouseMove: false, shouldOpen: !this.dead }),
      requestOpen: details => this.change(true, details) });
    this.onFocus = event => this.focusController.focus(event, this.trigger, this.trigger.matches(':focus-visible'));
    this.onBlur = event => this.focusController.blur(event, () => {
      const current = activeElement(this.el.ownerDocument);
      return { relatedTargetMissing: !event.relatedTarget, activeIsReference: current === this.trigger,
        activeInsideFloating: contains(this.popup, current), activeInsideReference: contains(this.trigger, current),
        movedToFocusGuard: false, nextInsideEnabledTrigger: false };
    });
    this.onPointer = event => { this.pointerType = event.pointerType; };
    this.onEnter = event => {
      if (this.delay === 0 && ['mouse', 'pen', '', undefined].includes(this.pointerType)) {
        this.change(true, createChangeEventDetails('trigger-hover', event, this.trigger));
      }
    };
    this.onMove = event => this.hoverController.move(event, this.trigger);
    this.onLeave = event => {
      this.focusController.mouseLeave(); this.hoverController.clear();
      if (!this.clickLike) this.change(false, createChangeEventDetails('trigger-hover', event));
    };
    this.onClick = event => {
      this.hoverController.clear();
      if (this.open) this.change(false, createChangeEventDetails('trigger-press', event, this.trigger));
    };
    this.onKey = event => runDialogEscapeKey(event, { open: this.open, enabled: true, escapeKey: true,
      composing: this.composing, bubbles: false, blockingChild: false }, details => this.change(false, details));
    this.onCompositionStart = () => { this.composing = true; };
    this.onCompositionEnd = () => { this.composing = false; };
    this.trigger.addEventListener('focus', this.onFocus); this.trigger.addEventListener('blur', this.onBlur);
    this.trigger.addEventListener('pointerenter', this.onPointer); this.trigger.addEventListener('pointerdown', this.onPointer);
    this.trigger.addEventListener('mouseenter', this.onEnter); this.trigger.addEventListener('mouseleave', this.onLeave);
    this.trigger.addEventListener('mousemove', this.onMove); this.trigger.addEventListener('click', this.onClick);
    this.el.ownerDocument.addEventListener('keydown', this.onKey);
    this.trigger.addEventListener('compositionstart', this.onCompositionStart); this.trigger.addEventListener('compositionend', this.onCompositionEnd);
    this.el.dataset.fixtureReady = 'true';
  },
  change(open, details) {
    if (this.dead || this.open === open) return;
    this.open = open;
    this.focusController.openChanged(details.reason, this.trigger);
    if (open) {
      this.clickLike = details.event.type === 'click' || details.event.type === 'mousedown';
      this.popup.showPopover();
      this.syncDescription();
      this.positioning = startAnchorPositioning(this.trigger, this.popup, { side: 'top', sideOffset: 8, collisionPadding: 8 });
    } else {
      this.hoverController.clear(); this.positioning?.destroy(); this.positioning = undefined;
      this.popup.hidePopover(); this.syncDescription(); this.clickLike = false;
    }
  },
  syncDescription() {
    const tokens = new Set((this.trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    if (this.open && !tokens.has(this.popup.id)) {
      tokens.add(this.popup.id); this.describedByOwned = true;
    } else if (!this.open && this.describedByOwned) {
      tokens.delete(this.popup.id); this.describedByOwned = false;
    }
    if (tokens.size) this.trigger.setAttribute('aria-describedby', [...tokens].join(' '));
    else this.trigger.removeAttribute('aria-describedby');
  },
  updated() { this.syncDescription(); this.positioning?.update(); },
  destroyed() {
    this.change(false, createChangeEventDetails('none'));
    this.dead = true; this.focusController.destroy(); this.hoverController.clear();
    this.trigger.removeEventListener('focus', this.onFocus); this.trigger.removeEventListener('blur', this.onBlur);
    this.trigger.removeEventListener('pointerenter', this.onPointer); this.trigger.removeEventListener('pointerdown', this.onPointer);
    this.trigger.removeEventListener('mouseenter', this.onEnter); this.trigger.removeEventListener('mouseleave', this.onLeave);
    this.trigger.removeEventListener('mousemove', this.onMove); this.trigger.removeEventListener('click', this.onClick);
    this.el.ownerDocument.removeEventListener('keydown', this.onKey);
    this.trigger.removeEventListener('compositionstart', this.onCompositionStart); this.trigger.removeEventListener('compositionend', this.onCompositionEnd);
  },
};
