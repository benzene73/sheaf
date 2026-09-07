import {getOpeningListIndex, navigateList, isListIndexDisabled} from '../behavior/list-navigation';
import {type ChangeEventDetails, createChangeEventDetails, runSingleInputKey, requestSingleSelectedValue,
  runSingleSelection, completeSingleClose} from '../behavior/combobox-input';

import {type HookDefinition, requirePart} from './hook-types';

interface SelectionReply {
  request_id: number;
  generation: number;
  accepted: boolean;
  obsolete: boolean;
  value: string | null;
}
interface PendingSelection {
  requestId: number;
  intent: number;
  value: string | null;
  details: ChangeEventDetails;
  closeAfter: boolean;
}
interface ComboboxState {
  input: HTMLInputElement;
  list: HTMLElement;
  open: boolean;
  popupMounted: boolean;
  active: string | null;
  intent: number;
  requestId: number;
  valueChanges: number;
  pending: PendingSelection | null;
  queryChanged: boolean;
  accepted: string | null;
  dead?: boolean;
  keyboardActive?: boolean;
  onKey: (event: KeyboardEvent) => void;
  onInput: () => void;
  onPointerDown: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void;
  onOutside: (event: PointerEvent) => void;
}
interface ComboboxMethods {
  allRows(): HTMLElement[];
  rows(): HTMLElement[];
  close(details: ChangeEventDetails): void;
  select(row: HTMLElement | undefined, event: Event): void;
  invalidate(): void;
  propose(value: string | null, details: ChangeEventDetails, closeAfter: boolean): void;
  finishProposal(reply: SelectionReply): void;
  sync(): void;
}
type IncomingEvents = { selection_result: SelectionReply };
type OutgoingEvents = {
  select: { value: string | null; request_id: number; generation: number };
  intent: { generation: number };
};

// Mapped behavior lives in ../behavior. This bridge deliberately delays selected
// value continuation until LiveView accepts it; this is an adapter extension.
export const PortedCombobox: HookDefinition<ComboboxState, ComboboxMethods, IncomingEvents, OutgoingEvents> = {
  mounted() {
    this.input = requirePart(this.el, '[data-part=input]', HTMLInputElement);
    this.list = requirePart(this.el, '[data-part=list]', HTMLElement);
    this.open = false;
    this.popupMounted = false;
    this.active = null;
    this.intent = 0;
    this.requestId = 0;
    this.valueChanges = 0;
    this.pending = null;
    this.handleEvent('selection_result', (reply: SelectionReply) => this.finishProposal(reply));
    this.queryChanged = false;
    this.accepted = this.el.dataset.accepted || null;
    this.input.value = this.accepted || '';
    this.onKey = (event: KeyboardEvent) => {
      const rows = this.rows();
      const index = rows.findIndex((item: HTMLElement) => item.id === this.active);
      const handled = runSingleInputKey({
        disabled: this.input.disabled, readOnly: this.input.readOnly,
        open: this.open, mounted: this.popupMounted,
        activeIndex: index < 0 ? null : index, selectedValue: this.accepted,
        direction: getComputedStyle(this.input).direction === 'rtl' ? 'rtl' : 'ltr',
        gecko: /Gecko\//.test(navigator.userAgent) && !/like Gecko/.test(navigator.userAgent),
        inputValue: this.input.value, inputScrollWidth: this.input.scrollWidth,
        inputClientWidth: this.input.clientWidth,
      }, {
        key: event.key, ctrlKey: event.ctrlKey, shiftKey: event.shiftKey,
        altKey: event.altKey, metaKey: event.metaKey, which: event.which,
        nativeEvent: event, preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation(),
      }, {
        markKeyboard: () => { this.keyboardActive = true; },
        setCaret: (position: number) => this.input.setSelectionRange(position, position),
        setScrollLeft: (position: number) => { this.input.scrollLeft = position; },
        requestInput: (value: string) => { this.input.value = value; },
        requestValue: (value: null, details: ChangeEventDetails) => this.propose(value, details, false),
        requestOpen: (_value: false, details: ChangeEventDetails) => this.close(details),
        clickActive: (position: number, nativeEvent: Event) => this.select(rows[position], nativeEvent),
      });
      // Input and floating-navigation handlers are separate upstream. readOnly
      // prevents editing/selection but still permits keyboard browsing.
      if (handled && !(this.input.readOnly && ['ArrowDown', 'ArrowUp'].includes(event.key))) return;
      if (event.key === 'Escape' && this.open) {
        event.preventDefault(); event.stopPropagation();
        this.close(createChangeEventDetails('escape-key', event));
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const wasOpen = this.open;
        this.open = true; this.popupMounted = true;
        this.sync();
        const visible = this.rows();
        const selectedIndex = visible.findIndex((item: HTMLElement) => item.dataset.value === this.accepted);
        const nextIndex = wasOpen
          ? navigateList({list: visible, currentIndex: visible.findIndex((item: HTMLElement) => item.id === this.active),
              key: event.key, loopFocus: this.el.dataset.loop !== 'false',
              allowEscape: true, typeable: true, disabledIndices: []})
          : selectedIndex >= 0 ? selectedIndex : getOpeningListIndex(visible, event.key);
        this.active = nextIndex == null ? this.active : visible[nextIndex]?.id ?? null;
        this.sync();
      }
    };
    this.onInput = () => {
      if (this.input.readOnly || this.input.disabled) return;
      this.invalidate();
      this.queryChanged = true;
      this.active = null;
      this.open = true; this.popupMounted = true;
      this.sync();
    };
    this.onPointerDown = (event: PointerEvent) => {
      if ((event.target as Element).closest<HTMLElement>('[role=option]')) event.preventDefault();
    };
    this.onClick = (event: MouseEvent) => {
      const row = (event.target as Element).closest<HTMLElement>('[role=option]');
      if (row && this.list.contains(row)) this.select(row, event);
    };
    this.onOutside = (event: PointerEvent) => {
      if (this.open && !this.el.contains(event.target as Node)) {
        this.close(createChangeEventDetails('outside-press', event));
      }
    };
    this.input.addEventListener('keydown', this.onKey);
    this.input.addEventListener('input', this.onInput);
    this.list.addEventListener('pointerdown', this.onPointerDown);
    this.list.addEventListener('click', this.onClick);
    this.el.ownerDocument.addEventListener('pointerdown', this.onOutside);
    this.sync();
    this.el.dataset.fixtureReady = 'true';
  },
  allRows() { return Array.from(this.list.querySelectorAll<HTMLElement>('[role=option]')); },
  rows() { return this.allRows().filter((row: HTMLElement) => !row.hidden); },
  close(details: ChangeEventDetails) {
    if (this.el.dataset.cancelClose === 'true') details.cancel();
    if (details.isCanceled) return;
    this.invalidate();
    this.open = false;
    // This fixture has no exit animation. Completion is immediate but remains a
    // separate transition, so adding presence must not move restoration earlier.
    completeSingleClose({selectedLabel: this.accepted || ''}, {
      getInputValue: () => this.input.value,
      setMounted: (value: boolean) => { this.popupMounted = value; },
      setQueryChanged: (value: boolean) => { this.queryChanged = value; },
      setCloseQuery: () => {},
      clearActiveIndex: () => { this.active = null; },
      requestInput: (value: string) => { this.input.value = value; },
    });
    this.sync();
  },
  select(row: HTMLElement, event: Event) {
    if (!row || this.input.readOnly || this.input.disabled) return;
    const rows = this.rows();
    if (isListIndexDisabled(rows, rows.indexOf(row))) return;
    const value = row.dataset.value;
    if (value === undefined) throw new Error('Option missing data-value');
    this.propose(value, createChangeEventDetails('item-press', event), true);
  },
  invalidate() {
    ++this.intent;
    this.pending = null;
    this.pushEvent('intent', {generation: this.intent});
  },
  propose(value: string | null, details: ChangeEventDetails, closeAfter: boolean) {
    const requestId = ++this.requestId;
    this.pending = {requestId, intent: this.intent, value, details, closeAfter};
    this.pushEvent('select', {value, request_id: requestId, generation: this.intent});
  },
  finishProposal(reply: SelectionReply) {
    const pending = this.pending;
    if (this.dead || !pending || reply.request_id !== pending.requestId ||
        reply.generation !== this.intent || pending.intent !== this.intent) return;
    this.pending = null;
    if (reply.obsolete) return;
    const {value, details, closeAfter} = pending;
    const requestSelectedValue = (next: string | null, change: ChangeEventDetails) => requestSingleSelectedValue(next, change, {
      onValueChange: (_value: string | null, mutable: ChangeEventDetails) => { if (!reply.accepted) mutable.cancel(); },
      assignValue: () => { this.accepted = reply.value || null; },
      stringifyValueLabel: (item: string | null) => item || '',
      requestInput: (text: string) => { this.input.value = text; },
    });
    if (closeAfter) runSingleSelection(value, details, {
      requestSelectedValue, requestOpen: (_open: false, change: ChangeEventDetails) => this.close(change),
    });
    else requestSelectedValue(value, details);
    const output = this.el.querySelector('[data-part=value-change-count]');
    if (output) output.textContent = String(++this.valueChanges);
    this.sync();
  },
  sync() {
    this.list.hidden = !this.open;
    for (const row of this.allRows()) {
      row.hidden = this.queryChanged && !(row.textContent || '').toLowerCase().includes(this.input.value.toLowerCase());
    }
    this.input.setAttribute('aria-expanded', String(this.open));
    const row = this.open && this.rows().find((item: HTMLElement) => item.id === this.active);
    if (row) this.input.setAttribute('aria-activedescendant', row.id);
    else { this.active = null; this.input.removeAttribute('aria-activedescendant'); }
  },
  updated() {
    // Canonical reconciliation is independent of a pending interaction. A stale
    // continuation must not freeze the browser's accepted-value snapshot.
    this.accepted = this.el.dataset.accepted || null;
    this.sync();
  },
  destroyed() {
    this.dead = true;
    ++this.intent;
    this.input.removeEventListener('keydown', this.onKey);
    this.input.removeEventListener('input', this.onInput);
    this.list.removeEventListener('pointerdown', this.onPointerDown);
    this.list.removeEventListener('click', this.onClick);
    this.el.ownerDocument.removeEventListener('pointerdown', this.onOutside);
  },
};
