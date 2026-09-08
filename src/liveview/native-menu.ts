import {createMenuTypeahead} from '../behavior/menu-typeahead';
import {getOpeningListIndex, navigateList, isListIndexDisabled} from '../behavior/list-navigation';
import {NativePopupController} from './native-popup-controller';
import {requirePart, type HookDefinition} from './hook-types';
import {activateMenuItemKey, suppressMenuItemKeyUp, dispatchMenuItemClick} from '../behavior/menu-activation';

interface State {
  anchor: HTMLButtonElement;
  popup: HTMLElement;
  layer: HTMLElement;
  backdrop: HTMLElement;
  open: boolean;
  typing: boolean;
  typeahead: ReturnType<typeof createMenuTypeahead>;
  controller: NativePopupController;
  onTriggerKey: (event: KeyboardEvent) => void;
  onPopupKey: (event: KeyboardEvent) => void;
  onPopupKeyUp: (event: KeyboardEvent) => void;
  onClick: (event: MouseEvent) => void;
  onBlur: (event: FocusEvent) => void;
}
interface Methods {
  rows(): HTMLElement[];
  focusIndex(index: number | null): void;
  close(restoreFocus?: boolean): void;
  activate(row: HTMLElement): void;
}

// Source-derived navigation/typeahead/positioning with explicit native-popover
// integration. Dismissal and activation below are adapter behavior, not a claim
// to have translated the complete Menu/FloatingFocusManager interaction stack.
export const NativeMenu: HookDefinition<State, Methods, {}, {menu_action: {component_id: string; value: string}}> = {
  mounted() {
    this.anchor = requirePart(this.el, '[data-part=anchor]', HTMLButtonElement);
    this.popup = requirePart(this.el, '[data-part=menu]', HTMLElement);
    this.layer = requirePart(this.el, '[data-part=layer]', HTMLElement);
    this.backdrop = requirePart(this.el, '[data-part=backdrop]', HTMLElement);
    this.open = false;
    this.typing = false;
    this.typeahead = createMenuTypeahead({
      getState: () => {
        const rows = this.rows();
        const index = rows.findIndex(row => row === this.el.ownerDocument.activeElement);
        return {labels: rows.map(row => row.dataset.label ?? row.textContent?.trim() ?? null), elements: rows,
          activeIndex: index < 0 ? null : index, open: this.open};
      },
      onMatch: index => { if (this.open) this.focusIndex(index); },
      onTyping: typing => { this.typing = typing; },
    });
    this.controller = new NativePopupController({anchor: this.anchor, layer: this.layer,
      popup: this.popup, backdrop: this.backdrop}, {
      modal: () => this.el.dataset.modal !== 'false',
      positioning: {positionMethod: 'fixed', side: 'bottom', align: 'start', sideOffset: 4},
      onOpen: key => {
        this.open = true;
        this.typeahead.sync();
        this.focusIndex(getOpeningListIndex(this.rows(), key));
      },
      onClose: () => { this.open = false; this.typeahead.sync(); },
    });
    this.onTriggerKey = event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); this.controller.openWithKey(event.key);
      }
    };
    this.onPopupKey = event => {
      const rows = this.rows();
      const index = rows.findIndex(row => row === this.el.ownerDocument.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); this.close(); return;
      }
      if (event.key === 'Tab') {
        this.close(false);
        return; // Native sequential focus proceeds from the restored trigger.
      }
      const next = navigateList({list: rows, currentIndex: index, key: event.key,
        typeable: false, allowEscape: false, disabledIndices: []});
      if (next !== null) {
        event.preventDefault(); this.focusIndex(next); return;
      }
      const row = rows[index];
      if (row instanceof HTMLButtonElement && row.hasAttribute('data-native-action')) {
        const disabled = isListIndexDisabled(rows, index);
        // aria-disabled remains focusable; it must not perform native submission.
        if (disabled && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
        if (activateMenuItemKey({disabled, typing: this.typing, isCurrentTarget: event.target === row,
          nativeButton: true, isButton: true}, event, () => dispatchMenuItemClick(row, event))) return;
        this.typeahead.onKeyDown(event);
        return;
      }
      if (row && activateMenuItemKey({disabled: isListIndexDisabled(rows, index),
        typing: this.typing, isCurrentTarget: event.target === row}, event,
        () => this.activate(row))) {
          return;
      }
      this.typeahead.onKeyDown(event);
    };
    this.onPopupKeyUp = event => {
      const row = event.target instanceof Element ? event.target.closest('[role=menuitem]') : null;
      if (row instanceof HTMLButtonElement && row.hasAttribute('data-native-action') && this.popup.contains(row)) {
        suppressMenuItemKeyUp({disabled: row.disabled || row.getAttribute('aria-disabled') === 'true',
          isCurrentTarget: event.target === row, nativeButton: true, isButton: true}, event);
      }
    };
    this.onClick = event => {
      const target = event.target;
      const row = target instanceof Element ? target.closest('[role=menuitem]') : null;
      if (row instanceof HTMLElement && this.popup.contains(row)) {
        if (row instanceof HTMLButtonElement && row.hasAttribute('data-native-action')) {
          if (row.disabled || isListIndexDisabled(this.rows(), this.rows().indexOf(row))) {
            event.preventDefault(); return;
          }
          if (!event.defaultPrevented && this.el.dataset.keepOpen !== 'true') this.close();
          // Preserve native form/default action; do not also emit menu_action.
          return;
        }
        this.activate(row);
      }
    };
    this.onBlur = event => {
      const next = event.relatedTarget;
      this.typeahead.onBlur(next instanceof Node && this.el.contains(next));
    };
    this.anchor.addEventListener('keydown', this.onTriggerKey);
    this.popup.addEventListener('keydown', this.onPopupKey);
    this.popup.addEventListener('keyup', this.onPopupKeyUp);
    this.popup.addEventListener('click', this.onClick);
    this.el.addEventListener('focusout', this.onBlur);
    this.el.dataset.fixtureReady = 'true';
  },
  rows() { return Array.from(this.popup.querySelectorAll<HTMLElement>('[role=menuitem]')); },
  focusIndex(index) {
    if (index !== null) this.rows()[index]?.focus();
  },
  activate(row) {
    const rows = this.rows();
    if (isListIndexDisabled(rows, rows.indexOf(row))) return;
    const value = row.dataset.value;
    if (value === undefined) throw new Error('Menu item requires data-value');
    this.pushEvent('menu_action', {component_id: this.el.id, value});
    if (this.el.dataset.keepOpen !== 'true') this.close();
  },
  close(restoreFocus = true) { this.controller.close(restoreFocus); },
  updated() { this.controller.refresh(); this.typeahead.sync(); },
  destroyed() {
    this.typeahead.destroy(); this.controller.destroy();
    this.anchor.removeEventListener('keydown', this.onTriggerKey);
    this.popup.removeEventListener('keydown', this.onPopupKey);
    this.popup.removeEventListener('keyup', this.onPopupKeyUp);
    this.popup.removeEventListener('click', this.onClick);
    this.el.removeEventListener('focusout', this.onBlur);
  },
};
