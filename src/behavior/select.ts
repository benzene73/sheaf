/**
 * Bounded Select consumer translation from Base UI SelectRoot.tsx/SelectItem.tsx.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';
import { createMenuTypeahead, type TypeaheadTimer } from './menu-typeahead';
import { getOpeningListIndex } from './list-navigation';

/** Attribute-only upstream utility; hidden force-mounted Select items remain searchable. */
export function isElementDisabled(element: HTMLElement | null) {
  return element == null || element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
}
export interface SelectValueEffects<Value> {
  onValueChange?(value: Value, details: ChangeEventDetails): void;
  assignValue(value: Value): void;
}
/** SelectRoot setValue; canceled requests leave canonical value unchanged. */
export function requestSelectValue<Value>(value: Value, details: ChangeEventDetails, effects: SelectValueEffects<Value>) {
  effects.onValueChange?.(value, details);
  if (details.isCanceled) return;
  effects.assignValue(value);
}
export interface SelectSelectionEffects<Value> {
  requestValue(value: Value, details: ChangeEventDetails): void;
  requestOpen(value: false, details: ChangeEventDetails): void;
}
/**
 * SelectItem single branch after legitimate item activation. Unlike Combobox,
 * close gets fresh details and is still requested when value was canceled.
 * Pointer drag/virtual-click eligibility must be checked by the item adapter.
 */
export function runSelectItemSelection<Value>(
  state: { rootDisabled: boolean; readOnly: boolean; itemDisabled: boolean },
  value: Value, event: Event, effects: SelectSelectionEffects<Value>,
) {
  if (state.rootDisabled || state.readOnly || state.itemDisabled) return;
  effects.requestValue(value, createChangeEventDetails('item-press', event));
  effects.requestOpen(false, createChangeEventDetails('item-press', event));
}

/** Keyboard-opening selectedIndex sync; pointer opening is a separate focus policy. */
export function getSelectOpeningIndex(list: ReadonlyArray<HTMLElement | null>, selectedIndex: number | null, key: string) {
  return selectedIndex !== null ? selectedIndex : getOpeningListIndex(list, key);
}

/** SelectItem onKeyDown branch; button activation is composed separately. */
export function runSelectItemKey(
  index: number,
  event: { key: string; preventDefault(): void },
  typing: boolean,
  setActiveIndex: (index: number) => void,
) {
  setActiveIndex(index);
  if (event.key === ' ' && typing) event.preventDefault();
}

export interface SelectTypeaheadState<Value> {
  labels: Array<string | null>;
  elements: Array<HTMLElement | null>;
  values: Value[];
  activeIndex: number | null;
  selectedIndex: number | null;
  open: boolean;
  disabled: boolean;
  readOnly: boolean;
}
export interface SelectTypeaheadOptions<Value> {
  getState(): SelectTypeaheadState<Value>;
  setActiveIndex(index: number): void;
  requestValue(value: Value, details: ChangeEventDetails): void;
  onTyping?(typing: boolean): void;
  timer?: TypeaheadTimer;
}
/** SelectRoot useTypeahead options/onMatch, sharing the actual extracted engine. */
export function createSelectTypeahead<Value>(options: SelectTypeaheadOptions<Value>) {
  return createMenuTypeahead({
    getState() {
      const state = options.getState();
      return {
        labels: state.labels,
        activeIndex: state.activeIndex,
        selectedIndex: state.selectedIndex,
        open: state.open,
        enabled: !state.disabled && (state.open || !state.readOnly),
        // Do not provide elements: closed force-mounted options may be hidden.
        disabledIndices: index => isElementDisabled(state.elements[index] ?? null),
      };
    },
    resetMs: 750,
    timer: options.timer,
    onTyping: options.onTyping,
    onMatch(index) {
      const state = options.getState();
      if (state.open) options.setActiveIndex(index);
      else options.requestValue(state.values[index], createChangeEventDetails('none'));
    },
  });
}
