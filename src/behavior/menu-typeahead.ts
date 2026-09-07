/**
 * Translation of Base UI useTypeahead.ts, consumed with MenuRoot's 500ms timeout.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { isElementVisible, isListIndexDisabled, type DisabledIndices } from './list-navigation';

export interface MenuTypeaheadState {
  labels: Array<string | null>;
  elements?: Array<HTMLElement | null>;
  activeIndex: number | null;
  selectedIndex?: number | null;
  open: boolean;
  enabled?: boolean;
  disabledIndices?: DisabledIndices;
}
export interface TypeaheadKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}
export interface TypeaheadTimer {
  start(ms: number, callback: () => void): void;
  clear(): void;
}
export interface MenuTypeaheadOptions {
  getState(): MenuTypeaheadState;
  onMatch(index: number): void;
  onTyping?(typing: boolean): void;
  resetMs?: number;
  timer?: TypeaheadTimer;
}

/** Explicit timer ownership replacing useTimeout, cleared when the hook is destroyed. */
function createTimer(): TypeaheadTimer {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return {
    start(ms, callback) { clearTimeout(timeout); timeout = setTimeout(callback, ms); },
    clear() { clearTimeout(timeout); timeout = undefined; },
  };
}

export function createMenuTypeahead(options: MenuTypeaheadOptions) {
  const initial = options.getState();
  const timer = options.timer ?? createTimer();
  const resetMs = options.resetMs ?? 500;
  let string = '';
  let prevIndex: number | null = initial.selectedIndex ?? initial.activeIndex ?? -1;
  let matchIndex: number | null = null;
  let previousOpen = initial.open;
  let previousSelected = initial.selectedIndex ?? null;
  let destroyed = false;

  function onKeyDown(event: TypeaheadKeyEvent) {
    if (destroyed) return;
    const state = options.getState();
    if (state.enabled === false) return;
    const { labels: listContent, elements, activeIndex, open, disabledIndices } = state;
    const selectedIndex = state.selectedIndex ?? null;
    function isItemAvailable(index: number) {
      const element = elements?.[index];
      if ((element && !isElementVisible(element)) || element?.matches(':disabled')) return false;
      return disabledIndices == null || !isListIndexDisabled([], index, disabledIndices);
    }
    function getMatchingIndex(list: Array<string | null>, query: string, startIndex = 0) {
      if (list.length === 0) return -1;
      const normalizedStartIndex = ((startIndex % list.length) + list.length) % list.length;
      const lowerString = query.toLowerCase();
      for (let offset = 0; offset < list.length; offset += 1) {
        const index = (normalizedStartIndex + offset) % list.length;
        const text = list[index];
        if (!text?.toLowerCase().startsWith(lowerString) || !isItemAvailable(index)) continue;
        return index;
      }
      return -1;
    }
    if (string.length > 0 && event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      options.onTyping?.(true);
    }
    if (string.length > 0 && string[0] !== ' ') {
      if (getMatchingIndex(listContent, string) === -1 && event.key !== ' ') options.onTyping?.(false);
    }
    if (listContent == null || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    if (open && event.key !== ' ') {
      event.preventDefault();
      event.stopPropagation();
      options.onTyping?.(true);
    }
    const isNewSession = string === '';
    if (isNewSession) prevIndex = selectedIndex ?? activeIndex ?? -1;
    const allowRapidSuccessionOfFirstLetter = listContent.every((text, index) =>
      text && isItemAvailable(index) ? text[0]?.toLowerCase() !== text[1]?.toLowerCase() : true);
    if (allowRapidSuccessionOfFirstLetter && string === event.key) {
      string = '';
      prevIndex = matchIndex;
    }
    string += event.key;
    timer.start(resetMs, () => {
      if (destroyed) return;
      string = '';
      prevIndex = matchIndex;
      options.onTyping?.(false);
    });
    const previousIndex = isNewSession ? (selectedIndex ?? activeIndex ?? -1) : prevIndex;
    const startIndex = (previousIndex ?? 0) + 1;
    const index = getMatchingIndex(listContent, string, startIndex);
    if (index !== -1) {
      options.onMatch(index);
      matchIndex = index;
    } else if (event.key !== ' ') {
      string = '';
      options.onTyping?.(false);
    }
  }

  /** Host resolves reference/floating shadow-aware containment before calling. */
  function onBlur(withinComposite: boolean) {
    if (destroyed || options.getState().enabled === false || withinComposite) return;
    timer.clear();
    string = '';
    prevIndex = matchIndex;
    options.onTyping?.(false);
  }

  /** Call after open or selectedIndex changes; translates upstream layout effect. */
  function sync() {
    if (destroyed) return;
    const { open, selectedIndex: selected = null } = options.getState();
    if (open === previousOpen && selected === previousSelected) return;
    previousOpen = open;
    previousSelected = selected;
    if (!open && selected !== null) return;
    timer.clear();
    matchIndex = null;
    if (string !== '') string = '';
  }
  return {
    onKeyDown, onBlur, sync,
    destroy() { destroyed = true; timer.clear(); },
  };
}
