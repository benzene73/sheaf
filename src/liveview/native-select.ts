import {getSelectOpeningIndex, createSelectTypeahead, requestSelectValue,
  runSelectItemSelection, runSelectItemKey, isElementDisabled} from '../behavior/select';
import {navigateList} from '../behavior/list-navigation';
import {activateMenuItemKey} from '../behavior/menu-activation';
import type {ChangeEventDetails} from '../behavior/combobox-input';
import {NativePopupController} from './native-popup-controller';
import {requirePart, type HookDefinition} from './hook-types';

interface State {
  anchor: HTMLButtonElement; popup: HTMLElement; controller: NativePopupController;
  valueDisplay: HTMLElement;
  accepted: string | null;
  formMode: boolean; hidden: HTMLInputElement | null; form: HTMLFormElement | null;
  serverValue: string | null; dead: boolean; onReset: (event: Event) => void; typing: boolean;
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
 * Form mode emits native field events; legacy observer mode emits select_value.
 * Cancellation here is an explicit synchronous policy supplied by the server;
 * asynchronous validation/rollback is not claimed by this bounded fixture. */
export const NativeSelect: HookDefinition<State, Methods, {},
  {select_value: {component_id: string; value: string; canceled: boolean}}> = {
  mounted() {
    this.anchor = requirePart(this.el, '[data-part=anchor]', HTMLButtonElement);
    this.valueDisplay = requirePart(this.anchor, '[data-part=value]', HTMLElement);
    this.popup = requirePart(this.el, '[data-part=select]', HTMLElement);
    this.accepted = this.el.dataset.accepted || null;
    this.serverValue = this.accepted; this.dead = false;
    this.formMode = this.el.dataset.mode === 'form';
    this.hidden = this.el.querySelector<HTMLInputElement>('[data-part=hidden]');
    this.form = this.hidden?.form ?? this.anchor.form;
    this.onReset = event => queueMicrotask(() => {
      if (event.defaultPrevented || this.dead || !this.formMode) return;
      this.accepted = this.serverValue; this.controller.close(false); this.sync(); this.typeahead.sync();
    });
    this.form?.addEventListener('reset', this.onReset);
    this.typing = false;
    this.typeahead = createSelectTypeahead<string>({
      getState: () => {
        const rows = this.rows();
        const active = rows.findIndex(row => row === this.el.ownerDocument.activeElement);
        const selected = rows.findIndex(row => row.dataset.value === this.accepted);
        return {labels: rows.map(row => row.dataset.label ?? row.textContent?.trim() ?? null), elements: rows,
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
    const previous = this.accepted;
    requestSelectValue(value, details, {
      onValueChange: (_, change) => { if (this.el.dataset.cancelValue === 'true') change.cancel(); },
      assignValue: next => { this.accepted = next; this.sync(); },
    });
    if (this.formMode) {
      if (!details.isCanceled && this.accepted !== previous && this.hidden) {
        this.hidden.dispatchEvent(new Event('input', {bubbles: true}));
        this.hidden.dispatchEvent(new Event('change', {bubbles: true}));
      }
    } else this.pushEvent('select_value', {component_id: this.el.id, value, canceled: details.isCanceled});
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
    const selected = this.rows().find(row => row.dataset.value === this.accepted);
    this.valueDisplay.textContent = selected?.dataset.label ?? selected?.textContent?.trim() ?? this.accepted ?? this.valueDisplay.dataset.placeholder ?? '';
    if (this.formMode && this.hidden) this.hidden.value = this.accepted ?? '';
    for (const row of this.rows()) row.setAttribute('aria-selected', String(row.dataset.value === this.accepted));
  },
  updated() {
    const serverValue = this.el.dataset.accepted || null;
    if (!this.formMode || serverValue !== this.serverValue) this.accepted = serverValue;
    this.serverValue = serverValue; this.sync(); this.typeahead.sync();
  },
  destroyed() {
    this.dead = true; this.form?.removeEventListener('reset', this.onReset);
    this.typeahead.destroy(); this.controller.destroy();
    this.anchor.removeEventListener('keydown', this.onTriggerKey);
    this.popup.removeEventListener('keydown', this.onPopupKey);
    this.popup.removeEventListener('click', this.onClick);
    this.el.removeEventListener('focusout', this.onBlur);
  },
};
