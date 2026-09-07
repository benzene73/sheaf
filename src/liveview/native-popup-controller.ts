import {startAnchorPositioning, type AnchorPositioningParameters} from '../behavior/anchor-positioning';
import {acquireScrollLock, shouldLockAnchoredPopup} from '../behavior/scroll-lock';

export interface NativePopupParts {
  anchor: HTMLButtonElement;
  layer: HTMLElement;
  popup: HTMLElement;
  backdrop?: HTMLElement;
}
export interface NativePopupOptions {
  modal(): boolean;
  positioning: AnchorPositioningParameters;
  onOpen?(key: string | null): void;
  onClose?(): void;
  restoreFocus?: boolean;
}

/**
 * Shared LiveView/native integration, not a translated React focus manager.
 * Owns one top-layer popup, one positioner and one counted scroll-lock lease.
 * Item navigation and value state remain in the consuming behavioral primitive.
 */
export class NativePopupController {
  private positioning?: ReturnType<typeof startAnchorPositioning>;
  private releaseScroll?: () => void;
  private touchOpen = false;
  private interaction: '' | 'mouse' | 'touch' | 'pen' | 'keyboard' = '';
  private openingKey: string | null = null;
  private dead = false;

  constructor(readonly parts: NativePopupParts, private options: NativePopupOptions) {
    parts.layer.addEventListener('toggle', this.onToggle);
    parts.anchor.addEventListener('pointerdown', this.onPointer);
    parts.anchor.addEventListener('keydown', this.onKeyboard);
    parts.backdrop?.addEventListener('pointerdown', this.onBackdropPointer);
    parts.backdrop?.addEventListener('click', this.onBackdropClick);
  }

  get open() { return !this.dead && this.parts.layer.matches(':popover-open'); }
  get interactionType() { return this.interaction; }

  openWithKey(key: string) {
    if (this.dead) return;
    this.touchOpen = false;
    this.interaction = 'keyboard';
    this.openingKey = key;
    this.parts.layer.showPopover();
  }

  close(restoreFocus = this.options.restoreFocus !== false) {
    if (this.dead) return;
    this.parts.layer.hidePopover();
    if (restoreFocus && this.parts.anchor.isConnected) this.parts.anchor.focus();
  }

  refresh() {
    if (this.dead) return;
    this.parts.anchor.setAttribute('aria-expanded', String(this.open));
    this.positioning?.update();
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.positioning?.destroy();
    this.releaseScroll?.();
    const {anchor, layer, backdrop} = this.parts;
    layer.removeEventListener('toggle', this.onToggle);
    anchor.removeEventListener('pointerdown', this.onPointer);
    anchor.removeEventListener('keydown', this.onKeyboard);
    backdrop?.removeEventListener('pointerdown', this.onBackdropPointer);
    backdrop?.removeEventListener('click', this.onBackdropClick);
    if (layer.matches(':popover-open')) layer.hidePopover();
  }

  private onPointer = (event: PointerEvent) => {
    this.touchOpen = event.pointerType === 'touch';
    this.interaction = event.pointerType === 'touch' || event.pointerType === 'pen' ? event.pointerType : 'mouse';
  };
  private onKeyboard = () => { this.touchOpen = false; this.interaction = 'keyboard'; };
  private onBackdropPointer = (event: PointerEvent) => event.preventDefault();
  private onBackdropClick = (event: MouseEvent) => { event.preventDefault(); this.close(); };
  private onToggle = (event: ToggleEvent) => {
    if (this.dead) return;
    const {anchor, popup} = this.parts;
    const open = event.newState === 'open';
    anchor.setAttribute('aria-expanded', String(open));
    this.positioning?.destroy(); this.positioning = undefined;
    this.releaseScroll?.(); this.releaseScroll = undefined;
    if (open) {
      if (shouldLockAnchoredPopup(this.options.modal(), this.touchOpen, popup)) {
        this.releaseScroll = acquireScrollLock(anchor);
      }
      this.positioning = startAnchorPositioning(anchor, popup, this.options.positioning);
      this.options.onOpen?.(this.openingKey);
      this.openingKey = null;
    } else {
      this.options.onClose?.();
      const doc = anchor.ownerDocument;
      const focused = doc.activeElement;
      // Preserve deliberate outside focus; recover focus lost by removing popup.
      if (this.options.restoreFocus !== false && anchor.isConnected &&
          (focused === doc.body || (focused && popup.contains(focused)))) anchor.focus();
    }
  };
}
