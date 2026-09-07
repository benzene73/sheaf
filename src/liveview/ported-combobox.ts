import {getOpeningListIndex, navigateList, isListIndexDisabled} from '../behavior/list-navigation';
import {getFilter, resolveComboboxFilterQuery} from '../behavior/filter';
import {createComboboxChangeController} from '../behavior/combobox-change';
import {type ChangeEventDetails, createChangeEventDetails, runSingleInputKey, requestSingleSelectedValue,
  runSingleSelection, completeSingleClose} from '../behavior/combobox-input';

import {startAnchorPositioning} from '../behavior/anchor-positioning';
import {type HookDefinition, requirePart} from './hook-types';

interface SelectionReply {
  component_id: string;
  instance: string;
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
  instance: string;
  input: HTMLInputElement;
  list: HTMLElement;
  open: boolean;
  popupMounted: boolean;
  positioned: boolean;
  positioning?: ReturnType<typeof startAnchorPositioning>;
  active: string | null;
  intent: number;
  requestId: number;
  valueChanges: number;
  pending: PendingSelection | null;
  queryChanged: boolean;
  accepted: string | null;
  queryValue: string;
  composingValue: string | null;
  change: ReturnType<typeof createComboboxChangeController>;
  dead?: boolean;
  keyboardActive?: boolean;
  onKey: (event: KeyboardEvent) => void;
  onInput: (event: Event) => void;
  onCompositionStart: (event: CompositionEvent) => void;
  onCompositionEnd: (event: CompositionEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void;
  onOutside: (event: PointerEvent) => void;
}
interface ComboboxMethods {
  allRows(): HTMLElement[];
  valueLabel(value: string | null): string;
  rows(): HTMLElement[];
  close(details: ChangeEventDetails): void;
  select(row: HTMLElement | undefined, event: Event): void;
  invalidate(): void;
  propose(value: string | null, details: ChangeEventDetails, closeAfter: boolean): void;
  finishProposal(reply: SelectionReply): void;
  sync(): void;
  setInput(value: string): void;
  requestInput(value: string, details: ChangeEventDetails): void;
}
type IncomingEvents = { selection_result: SelectionReply };
type OutgoingEvents = {
  combobox_mount: { component_id: string; instance: string };
  select: { component_id: string; instance: string; value: string | null; request_id: number; generation: number };
  intent: { component_id: string; instance: string; generation: number };
};

// Mapped behavior lives in ../behavior. This bridge deliberately delays selected
// value continuation until LiveView accepts it; this is an adapter extension.
export const PortedCombobox: HookDefinition<ComboboxState, ComboboxMethods, IncomingEvents, OutgoingEvents> = {
  mounted() {
    if (!this.el.id) throw new Error('Combobox requires a unique DOM id');
    this.instance = Array.from(crypto.getRandomValues(new Uint8Array(16)),
      value => value.toString(16).padStart(2, '0')).join('');
    this.pushEvent('combobox_mount', {component_id: this.el.id, instance: this.instance});
    this.input = requirePart(this.el, '[data-part=input]', HTMLInputElement);
    this.list = requirePart(this.el, '[data-part=list]', HTMLElement);
    this.positioned = this.list.getAttribute('popover') === 'manual';
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
    this.queryValue = this.valueLabel(this.accepted);
    this.composingValue = null;
    this.input.value = this.queryValue;
    this.change = createComboboxChangeController({
      android: /Android/.test(navigator.userAgent),
      getState: () => ({disabled: this.input.disabled, readOnly: this.input.readOnly,
        open: this.open, openOnInputClick: true, autoHighlightEnabled: false,
        activeIndex: this.active === null ? null : this.rows().findIndex(row => row.id === this.active)}),
      setComposingValue: value => { this.composingValue = value; },
      requestInput: (value, details) => {
        this.requestInput(value, details);
        if (!details.isCanceled) this.queryChanged = true;
      },
      requestValue: (value, details) => this.propose(value, details, false),
      requestOpen: (open, details) => {
        if (!open) this.close(details);
        else { this.open = true; this.popupMounted = true; }
      },
      clearHighlight: () => { this.active = null; },
    });
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
        requestInput: (value, details) => this.requestInput(value, details),
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
    this.onInput = event => {
      if (this.input.readOnly || this.input.disabled) return;
      this.invalidate();
      this.change.onChange({currentTarget: this.input, nativeEvent: event});
      this.sync();
    };
    this.onCompositionStart = event => {
      this.invalidate();
      this.change.onCompositionStart({currentTarget: this.input, nativeEvent: event});
    };
    this.onCompositionEnd = event => {
      this.change.onCompositionEnd({currentTarget: this.input, nativeEvent: event});
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
    this.input.addEventListener('compositionstart', this.onCompositionStart);
    this.input.addEventListener('compositionend', this.onCompositionEnd);
    this.list.addEventListener('pointerdown', this.onPointerDown);
    this.list.addEventListener('click', this.onClick);
    this.el.ownerDocument.addEventListener('pointerdown', this.onOutside);
    this.sync();
    this.el.dataset.fixtureReady = 'true';
  },
  allRows() { return Array.from(this.list.querySelectorAll<HTMLElement>('[role=option]')); },
  valueLabel(value) {
    if (value === null) return '';
    const row = this.allRows().find(option => option.dataset.value === value);
    if (row) return row.dataset.label ?? row.textContent?.trim() ?? value;
    // A host can retain the selected label when its option is not currently rendered.
    if (value === this.el.dataset.accepted) return this.el.dataset.acceptedLabel ?? value;
    return value; // Preserve the original string-item contract for existing consumers.
  },
  setInput(value) { this.queryValue = value; this.input.value = value; },
  requestInput(value, details) {
    if (this.el.dataset.cancelInput === 'true') details.cancel();
    if (details.isCanceled) this.input.value = this.queryValue;
    else this.setInput(value);
  },
  rows() { return this.allRows().filter((row: HTMLElement) => !row.hidden); },
  close(details: ChangeEventDetails) {
    if (this.el.dataset.cancelClose === 'true') details.cancel();
    if (details.isCanceled) return;
    this.invalidate();
    this.open = false;
    // This fixture has no exit animation. Completion is immediate but remains a
    // separate transition, so adding presence must not move restoration earlier.
    completeSingleClose({selectedLabel: this.valueLabel(this.accepted)}, {
      getInputValue: () => this.input.value,
      setMounted: (value: boolean) => { this.popupMounted = value; },
      setQueryChanged: (value: boolean) => { this.queryChanged = value; },
      setCloseQuery: () => {},
      clearActiveIndex: () => { this.active = null; },
      requestInput: (value, change) => this.requestInput(value, change),
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
    this.pushEvent('intent', {component_id: this.el.id, instance: this.instance, generation: this.intent});
  },
  propose(value: string | null, details: ChangeEventDetails, closeAfter: boolean) {
    const requestId = ++this.requestId;
    this.pending = {requestId, intent: this.intent, value, details, closeAfter};
    this.pushEvent('select', {component_id: this.el.id, instance: this.instance,
      value, request_id: requestId, generation: this.intent});
  },
  finishProposal(reply: SelectionReply) {
    const pending = this.pending;
    if (this.dead || reply.component_id !== this.el.id || reply.instance !== this.instance ||
        !pending || reply.request_id !== pending.requestId ||
        reply.generation !== this.intent || pending.intent !== this.intent) return;
    this.pending = null;
    if (reply.obsolete) return;
    const {value, details, closeAfter} = pending;
    const requestSelectedValue = (next: string | null, change: ChangeEventDetails) => requestSingleSelectedValue(next, change, {
      onValueChange: (_value: string | null, mutable: ChangeEventDetails) => { if (!reply.accepted) mutable.cancel(); },
      assignValue: () => { this.accepted = reply.value || null; },
      stringifyValueLabel: (item: string | null) => this.valueLabel(item),
      requestInput: (text, change) => this.requestInput(text, change),
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
    if (this.dead) return;
    this.list.hidden = !this.open;
    const filter = getFilter();
    const {filterQuery} = resolveComboboxFilterQuery({
      open: this.open, closeQuery: null, inputValue: this.queryValue, single: true,
      selectedLabel: this.valueLabel(this.accepted), queryChangedAfterOpen: this.queryChanged,
    }, filter);
    for (const row of this.allRows()) {
      row.hidden = !filter.contains(row.dataset.label ?? row.textContent ?? '', filterQuery);
    }
    if (this.positioned) {
      if (this.open) {
        if (!this.list.matches(':popover-open')) this.list.showPopover();
        if (!this.positioning) {
          this.positioning = startAnchorPositioning(this.input, this.list, {
            positionMethod: 'fixed', side: 'bottom', align: 'start', sideOffset: 4,
            collisionPadding: 8, isMounted: () => !this.dead && this.open && this.list.matches(':popover-open'),
          });
        } else this.positioning.update();
      } else {
        this.positioning?.destroy(); this.positioning = undefined;
        if (this.list.matches(':popover-open')) this.list.hidePopover();
      }
    }
    this.input.setAttribute('aria-expanded', String(this.open));
    const row = this.open && this.rows().find((item: HTMLElement) => item.id === this.active);
    if (row) this.input.setAttribute('aria-activedescendant', row.id);
    else { this.active = null; this.input.removeAttribute('aria-activedescendant'); }
  },
  updated() {
    // Canonical reconciliation is independent of a pending interaction. A stale
    // continuation must not freeze the browser's accepted-value snapshot.
    const previousAccepted = this.accepted;
    this.accepted = this.el.dataset.accepted || null;
    if (previousAccepted !== this.accepted && !this.open && this.composingValue === null &&
        !this.queryChanged && !this.pending) this.setInput(this.valueLabel(this.accepted));
    if (this.composingValue !== null) this.input.value = this.composingValue;
    this.sync();
  },
  destroyed() {
    this.dead = true;
    ++this.intent;
    this.positioning?.destroy(); this.positioning = undefined;
    if (this.positioned && this.list.matches(':popover-open')) this.list.hidePopover();
    this.input.removeEventListener('keydown', this.onKey);
    this.input.removeEventListener('input', this.onInput);
    this.input.removeEventListener('compositionstart', this.onCompositionStart);
    this.input.removeEventListener('compositionend', this.onCompositionEnd);
    this.list.removeEventListener('pointerdown', this.onPointerDown);
    this.list.removeEventListener('click', this.onClick);
    this.el.ownerDocument.removeEventListener('pointerdown', this.onOutside);
  },
};
