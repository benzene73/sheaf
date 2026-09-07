import {getSelectOpeningIndex, createSelectTypeahead, requestSelectValue,
  runSelectItemSelection, runSelectItemKey, isElementDisabled} from '../behavior/select';
import {navigateList} from '../behavior/list-navigation';
import {activateMenuItemKey} from '../behavior/menu-activation';
import type {ChangeEventDetails} from '../behavior/combobox-input';
import {NativePopupController} from './native-popup-controller';
import {requirePart, type HookDefinition} from './hook-types';

interface State {
  anchor: HTMLButtonElement; popup: HTMLElement; controller: NativePopupController;
  accepted: string | null; typing: boolean;
  typeahead: ReturnType<typeof createSelectTypeahead<string>>;
  onTriggerKey: (event: KeyboardEvent) => void;
  onPopupKey: (event: KeyboardEvent) => void;
  onClick: (event: MouseEvent) => void;
  onBlur: (event: FocusEvent) => void;
}
interface Methods {
  rows(): HTMLElement[];
  focusIndex(index: number | null): void;
  requestValue(value: string, details: ChangeEventDetails): void;
  activate(row: HTMLElement, event: Event): void;
  sync(): void;
}

/** Single Select, explicit alignItemWithTrigger=false. Native integration is
 * separate from the source-translated value, navigation and typeahead policies.
 * Cancellation here is an explicit synchronous policy supplied by the server;
 * asynchronous validation/rollback is not claimed by this bounded fixture. */
export const NativeSelect: HookDefinition<State, Methods, {},
  {select_value: {value: string; canceled: boolean}}> = {
  mounted() {
    this.anchor = requirePart(this.el, '[data-part=anchor]', HTMLButtonElement);
    this.popup = requirePart(this.el, '[data-part=select]', HTMLElement);
    this.accepted = this.el.dataset.accepted || null;
    this.typing = false;
    this.typeahead = createSelectTypeahead<string>({
      getState: () => {
        const rows = this.rows();
        const active = rows.findIndex(row => row === this.el.ownerDocument.activeElement);
        const selected = rows.findIndex(row => row.dataset.value === this.accepted);
        return {labels: rows.map(row => row.textContent?.trim() ?? null), elements: rows,
          values: rows.map(row => row.dataset.value!), activeIndex: active < 0 ? null : active,
          selectedIndex: selected < 0 ? null : selected, open: this.controller?.open ?? false,
          disabled: this.anchor.disabled, readOnly: this.el.dataset.readOnly === 'true'};
      },
      setActiveIndex: index => this.focusIndex(index),
      requestValue: (value, details) => this.requestValue(value, details),
      onTyping: typing => { this.typing = typing; },
    });
    this.controller = new NativePopupController({anchor: this.anchor, popup: this.popup,
      layer: requirePart(this.el, '[data-part=layer]', HTMLElement),
      backdrop: requirePart(this.el, '[data-part=backdrop]', HTMLElement)}, {
      modal: () => this.el.dataset.modal !== 'false',
      positioning: {positionMethod: 'fixed', side: 'bottom', align: 'start'},
      onOpen: key => {
        this.typeahead.sync();
        const rows = this.rows();
        const selected = rows.findIndex(row => row.dataset.value === this.accepted);
        this.focusIndex(getSelectOpeningIndex(rows, selected < 0 ? null : selected, key || 'ArrowDown'));
      },
      onClose: () => this.typeahead.sync(),
    });
    this.onTriggerKey = event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault(); this.controller.openWithKey(event.key); return;
      }
      this.typeahead.onKeyDown(event);
    };
    this.onPopupKey = event => {
      const rows = this.rows();
      const index = rows.findIndex(row => row === this.el.ownerDocument.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); this.controller.close(); return;
      }
      if (event.key === 'Tab') { this.controller.close(false); return; }
      const next = navigateList({list: rows, currentIndex: index, key: event.key,
        typeable: false, loopFocus: false, allowEscape: false, disabledIndices: []});
      if (next !== null) { event.preventDefault(); this.focusIndex(next); return; }
      const row = rows[index];
      if (row) {
        runSelectItemKey(index, event, this.typing, () => {});
        if (activateMenuItemKey({disabled: isElementDisabled(row), typing: this.typing,
          isCurrentTarget: event.target === row}, event, () => this.activate(row, event))) return;
      }
      this.typeahead.onKeyDown(event);
    };
    this.onClick = event => {
      const row = event.target instanceof Element ? event.target.closest('[role=option]') : null;
      if (row instanceof HTMLElement && this.popup.contains(row)) this.activate(row, event);
    };
    this.onBlur = event => this.typeahead.onBlur(event.relatedTarget instanceof Node && this.el.contains(event.relatedTarget));
    this.anchor.addEventListener('keydown', this.onTriggerKey);
    this.popup.addEventListener('keydown', this.onPopupKey);
    this.popup.addEventListener('click', this.onClick);
    this.el.addEventListener('focusout', this.onBlur);
    this.sync(); this.el.dataset.fixtureReady = 'true';
  },
  rows() { return Array.from(this.popup.querySelectorAll<HTMLElement>('[role=option]')); },
  focusIndex(index) { if (index !== null) this.rows()[index]?.focus(); },
  requestValue(value, details) {
    requestSelectValue(value, details, {
      onValueChange: (_, change) => { if (this.el.dataset.cancelValue === 'true') change.cancel(); },
      assignValue: next => { this.accepted = next; this.sync(); },
    });
    this.pushEvent('select_value', {value, canceled: details.isCanceled});
  },
  activate(row, event) {
    const value = row.dataset.value;
    if (value === undefined) throw new Error('Select item requires data-value');
    runSelectItemSelection({rootDisabled: this.anchor.disabled,
      readOnly: this.el.dataset.readOnly === 'true', itemDisabled: isElementDisabled(row)}, value, event, {
      requestValue: (next, details) => this.requestValue(next, details),
      requestOpen: () => this.controller.close(),
    });
  },
  sync() {
    this.controller.refresh();
    this.anchor.textContent = this.accepted || 'Choose';
    for (const row of this.rows()) row.setAttribute('aria-selected', String(row.dataset.value === this.accepted));
  },
  updated() { this.accepted = this.el.dataset.accepted || null; this.sync(); this.typeahead.sync(); },
  destroyed() {
    this.typeahead.destroy(); this.controller.destroy();
    this.anchor.removeEventListener('keydown', this.onTriggerKey);
    this.popup.removeEventListener('keydown', this.onPopupKey);
    this.popup.removeEventListener('click', this.onClick);
    this.el.removeEventListener('focusout', this.onBlur);
  },
};
