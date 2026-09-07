/**
 * TabsRoot/TabsTab and non-grid button-only useCompositeRoot extraction.
 * Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';
import { getMinListIndex, getMaxListIndex, findNonDisabledListIndex, isIndexOutOfListBounds } from './list-navigation';
export type TabDirection = 'none' | 'left' | 'right' | 'up' | 'down';
export type TabChangeDetails = ChangeEventDetails & { activationDirection: TabDirection };
export function computeTabDirection<Value>(oldValue: Value | null, newValue: Value | null,
  orientation: 'horizontal' | 'vertical', getTab: (value: Value) => HTMLElement | null): TabDirection {
  if (oldValue == null || newValue == null) return 'none';
  const [position, backward, forward] = orientation === 'horizontal' ? ['left', 'left', 'right'] as const : ['top', 'up', 'down'] as const;
  const oldTab = getTab(oldValue), newTab = getTab(newValue);
  if (oldTab == null || newTab == null) {
    if (oldTab !== newTab && (typeof oldValue === 'number' || typeof oldValue === 'string') && typeof oldValue === typeof newValue) {
      return newValue > oldValue ? forward : backward;
    }
    return 'none';
  }
  const previous = oldTab.getBoundingClientRect()[position], next = newTab.getBoundingClientRect()[position];
  if (next < previous) return backward;
  if (next > previous) return forward;
  return 'none';
}
export function requestTabValue<Value>(value: Value, details: TabChangeDetails, effects: {
  computeDirection(value: Value): TabDirection; onValueChange?(value: Value, details: TabChangeDetails): void;
  assignValue(value: Value): void;
}) {
  details.activationDirection = effects.computeDirection(value);
  effects.onValueChange?.(value, details);
  if (details.isCanceled) return;
  effects.assignValue(value);
}
/** Host listens for document pointerup/pointercancel and calls pointerEnd. */
export function createTabActivation<Value>(getState: () => {
  value: Value; active: boolean; disabled: boolean; activateOnFocus: boolean;
}, request: (value: Value, details: TabChangeDetails) => void) {
  let pressing = false, mainButton = false;
  function activate(event: Event) {
    request(getState().value, createChangeEventDetails('none', event, undefined, { activationDirection: 'none' as TabDirection }));
  }
  return {
    click(event: Event) { const s = getState(); if (!s.active && !s.disabled) activate(event); },
    focus(event: Event) {
      const s = getState();
      if (!s.active && !s.disabled && s.activateOnFocus && (!pressing || mainButton)) activate(event);
    },
    pointerDown(event: { button: number }) {
      const s = getState(); if (s.active || s.disabled) return;
      pressing = true; mainButton = event.button === 0;
    },
    pointerEnd() { pressing = false; mainButton = false; },
  };
}
/** Button tabs only: editable descendants/grid/onLoop extension are outside this slice. */
export function runTabsNavigation(event: KeyboardEvent, state: {
  elements: readonly (HTMLElement | null)[]; highlightedIndex: number;
  orientation?: 'horizontal' | 'vertical'; direction?: 'ltr' | 'rtl'; loopFocus?: boolean;
}, effects: { highlight(index: number): void; queueFocus(index: number): void }) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  const orientation = state.orientation ?? 'horizontal', rtl = state.direction === 'rtl';
  const forward = orientation === 'vertical' ? event.key === 'ArrowDown' : event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
  const backward = orientation === 'vertical' ? event.key === 'ArrowUp' : event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
  const min = getMinListIndex(state.elements, []), max = getMaxListIndex(state.elements, []);
  let next = state.highlightedIndex;
  if (event.key === 'Home') next = min;
  else if (event.key === 'End') next = max;
  if (next === state.highlightedIndex && (forward || backward)) {
    if ((state.loopFocus ?? true) && next === max && forward) next = min;
    else if ((state.loopFocus ?? true) && next === min && backward) next = max;
    else next = findNonDisabledListIndex(state.elements, { startingIndex: next, decrement: backward, disabledIndices: [] });
  }
  if (next !== state.highlightedIndex && !isIndexOutOfListBounds(state.elements, next)) {
    event.stopPropagation(); event.preventDefault(); effects.highlight(next); effects.queueFocus(next);
  }
}
