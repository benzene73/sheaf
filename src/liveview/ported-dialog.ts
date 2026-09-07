import {requestDialogOpen, acceptsDialogOutsidePress} from '../behavior/dialog';
import {createChangeEventDetails} from '../behavior/combobox-input';
import {acquireScrollLock} from '../behavior/scroll-lock';
import {requirePart, type HookDefinition} from './hook-types';

interface State {
  dialog: HTMLDialogElement; trigger: HTMLButtonElement; open: boolean; dead: boolean;
  downOutside: boolean; releaseScroll?: () => void;
  onTrigger: (event: MouseEvent) => void;
  onClick: (event: MouseEvent) => void;
  onPointer: (event: PointerEvent) => void;
  onCancel: (event: Event) => void;
  onClose: (event: Event) => void;
}
interface Methods {
  request(open: boolean, reason: string, event: Event): void;
  outside(event: MouseEvent): boolean;
}

/** Native modal substrate; source DialogStore cancellation and outside-press
 * policies are retained. The browser owns focus trapping, inertness and top layer.
 * Kept mounted, without animation; nonmodal/trap-focus variants are not exposed. */
export const PortedDialog: HookDefinition<State, Methods, {},
  {dialog_request: {component_id: string; open: boolean; canceled: boolean}}> = {
  mounted() {
    this.dialog = requirePart(this.el, '[data-part=dialog]', HTMLDialogElement);
    this.trigger = requirePart(this.el, '[data-part=trigger]', HTMLButtonElement);
    this.open = this.dialog.open; this.dead = false; this.downOutside = false;
    this.onTrigger = event => this.request(true, 'trigger-press', event);
    this.onPointer = event => { this.downOutside = event.button === 0 && this.outside(event); };
    this.onClick = event => {
      const close = event.target instanceof Element ? event.target.closest('[data-part=close]') : null;
      if (close && this.dialog.contains(close)) { this.request(false, 'close-press', event); return; }
      const intentionalOutside = this.downOutside && this.outside(event);
      this.downOutside = false;
      // Native ::backdrop events target the dialog. Rect/press guards above are
      // the explicit replacement for useDismiss's inside/intentional-press guard.
      if (intentionalOutside && acceptsDialogOutsidePress(event, {
        outsidePressEnabled: true, topmost: true,
        disablePointerDismissal: this.el.dataset.disablePointerDismissal === 'true',
        modal: true, internalBackdrop: this.dialog, backdrop: null, popup: this.dialog,
      })) this.request(false, 'outside-press', event);
    };
    this.onCancel = event => {
      // Always cancel native auto-close, then let source callback cancellation
      // decide. Native cancel is delivered only to the topmost modal dialog.
      event.preventDefault(); event.stopPropagation();
      this.request(false, 'escape-key', event);
    };
    this.onClose = event => {
      // Externally closed native dialog (e.g. method=dialog) is observable too.
      if (this.open) {
        this.open = false; this.releaseScroll?.(); this.releaseScroll = undefined;
        this.trigger.setAttribute('aria-expanded', 'false');
        this.pushEvent('dialog_request', {component_id: this.el.id, open: false, canceled: false});
      }
    };
    this.trigger.addEventListener('click', this.onTrigger);
    this.dialog.addEventListener('pointerdown', this.onPointer);
    this.dialog.addEventListener('click', this.onClick);
    this.dialog.addEventListener('cancel', this.onCancel);
    this.dialog.addEventListener('close', this.onClose);
    this.el.dataset.fixtureReady = 'true';
  },
  outside(event) {
    if (event.target !== this.dialog) return false;
    const rect = this.dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  },
  request(open, reason, event) {
    if (this.dead || open === this.open) return;
    const details = createChangeEventDetails(reason, event, open ? this.trigger : undefined);
    requestDialogOpen(open, details, {activeTriggerId: this.trigger.id, activeTriggerElement: this.trigger}, {
      preventUnmount: () => {}, // This adapter always keeps the dialog mounted.
      onOpenChange: (next, change) => {
        if (!next && this.el.dataset.cancelClose === 'true') change.cancel();
        this.pushEvent('dialog_request', {component_id: this.el.id, open: next, canceled: change.isCanceled});
      },
      dispatchOpenChange: next => this.el.dispatchEvent(new CustomEvent('primitive:open-change', {detail: {open: next}, bubbles: true})),
      updateOpen: next => {
        this.open = next;
        if (next) {
          this.dialog.showModal();
          this.releaseScroll = acquireScrollLock(this.dialog);
        } else {
          this.releaseScroll?.(); this.releaseScroll = undefined;
          this.dialog.close();
        }
        this.trigger.setAttribute('aria-expanded', String(next));
      },
    });
  },
  updated() { this.trigger.setAttribute('aria-expanded', String(this.open)); },
  destroyed() {
    this.dead = true;
    this.releaseScroll?.(); this.releaseScroll = undefined;
    this.trigger.removeEventListener('click', this.onTrigger);
    this.dialog.removeEventListener('pointerdown', this.onPointer);
    this.dialog.removeEventListener('click', this.onClick);
    this.dialog.removeEventListener('cancel', this.onCancel);
    this.dialog.removeEventListener('close', this.onClose);
    if (this.dialog.open) this.dialog.close();
  },
};
