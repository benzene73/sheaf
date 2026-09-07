/**
 * Translated from Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * ComboboxInput.tsx, AriaCombobox.tsx, createBaseUIEventDetails.ts.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 * Bounded to single selection with input outside a non-inline popup, no chips.
 */
export interface ChangeEventDetails {
  reason: string;
  event: Event;
  trigger: Element | undefined;
  cancel(): void;
  allowPropagation(): void;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
}

/** Getter-backed flags and spread ordering retained from upstream. */
export function createChangeEventDetails<T extends object = object>(
  reason: string, event?: Event, trigger?: Element, customProperties?: T,
): ChangeEventDetails & T {
  let canceled = false;
  let allowPropagation = false;
  return {
    reason,
    event: event ?? new Event('base-ui'),
    cancel() { canceled = true; },
    allowPropagation() { allowPropagation = true; },
    get isCanceled() { return canceled; },
    get isPropagationAllowed() { return allowPropagation; },
    trigger,
    ...customProperties,
  } as ChangeEventDetails & T;
}

export interface InputKeyState {
  disabled: boolean;
  readOnly: boolean;
  open: boolean;
  mounted: boolean;
  activeIndex: number | null;
  selectedValue: unknown | null;
  direction: 'ltr' | 'rtl';
  gecko: boolean;
  inputValue: string;
  inputScrollWidth: number;
  inputClientWidth: number;
}
export interface InputKeyEvent {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  which: number;
  nativeEvent: Event;
  preventDefault(): void;
  stopPropagation(): void;
}
export interface InputKeyEffects {
  markKeyboard(): void;
  setCaret(index: number): void;
  setScrollLeft(value: number): void;
  requestInput(value: string, details: ChangeEventDetails): void;
  requestValue(value: null, details: ChangeEventDetails): void;
  requestOpen(value: false, details: ChangeEventDetails): void;
  clickActive(index: number, event: Event): void;
}
function stopEvent(event: InputKeyEvent) {
  event.preventDefault();
  event.stopPropagation();
}

/**
 * Returns whether this input-specific branch handled the key. Event cancellation
 * is explicit: true does NOT mean preventDefault. Open Escape belongs to dismissal.
 */
export function runSingleInputKey(state: InputKeyState, event: InputKeyEvent, effects: InputKeyEffects): boolean {
  if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return false;
  effects.markKeyboard();
  if (state.disabled || state.readOnly) {
    if (state.readOnly && event.key === 'Enter' && state.open && state.activeIndex !== null) {
      stopEvent(event);
    }
    return true;
  }
  const scrollAmount = state.inputScrollWidth - state.inputClientWidth;
  const isRTL = state.direction === 'rtl';
  if (event.key === 'Home') {
    stopEvent(event);
    effects.setCaret(state.gecko && isRTL ? state.inputValue.length : 0);
    effects.setScrollLeft(0);
    return true;
  }
  if (event.key === 'End') {
    stopEvent(event);
    effects.setCaret(state.gecko && isRTL ? 0 : state.inputValue.length);
    effects.setScrollLeft(isRTL ? -scrollAmount : scrollAmount);
    return true;
  }
  if (!state.mounted && event.key === 'Escape') {
    const isClear = state.selectedValue === null;
    const details = createChangeEventDetails('escape-key', event.nativeEvent);
    effects.requestInput('', details);
    effects.requestValue(null, details);
    if (!isClear && !details.isPropagationAllowed) event.stopPropagation();
    return true;
  }
  // Upstream chip handling is omitted by this module's no-chips contract.
  if (event.which === 229) return true;
  if (event.key === 'Enter' && state.open) {
    if (state.activeIndex === null) {
      effects.requestOpen(false, createChangeEventDetails('none', event.nativeEvent));
      return true; // Intentionally permits native form submission.
    }
    stopEvent(event);
    effects.clickActive(state.activeIndex, event.nativeEvent);
    return true;
  }
  return false;
}

export interface SelectedValueEffects<Value> {
  onValueChange?(value: Value | null, details: ChangeEventDetails): void;
  assignValue(value: Value | null): void;
  stringifyValueLabel(value: Value | null): string;
  requestInput(value: string, details: ChangeEventDetails): void;
}

/** setSelectedValue's single/outside branch; controlled assignValue may be a no-op. */
export function requestSingleSelectedValue<Value>(
  nextValue: Value | null, details: ChangeEventDetails, effects: SelectedValueEffects<Value>,
): void {
  effects.onValueChange?.(nextValue, details);
  if (details.isCanceled) return;
  effects.assignValue(nextValue);
  effects.requestInput(effects.stringifyValueLabel(nextValue),
    createChangeEventDetails(details.reason, details.event));
}

export interface SingleSelectionEffects<Value> {
  requestSelectedValue(value: Value | null, details: ChangeEventDetails): void;
  requestOpen(value: false, details: ChangeEventDetails): void;
}
/** handleSelection's single branch, after item/link guards. */
export function runSingleSelection<Value>(
  nextValue: Value | null, details: ChangeEventDetails, effects: SingleSelectionEffects<Value>,
): void {
  effects.requestSelectedValue(nextValue, details);
  if (details.isCanceled) return;
  effects.requestOpen(false, details);
}

export interface SingleCloseEffects {
  setMounted(value: false): void;
  onOpenChangeComplete?(value: false): void;
  setQueryChanged(value: false): void;
  setCloseQuery(value: null): void;
  clearActiveIndex(): void;
  requestInput(value: string, details: ChangeEventDetails): void;
}
/** handleUnmount's single/outside branch. Call at completion, never at request time. */
export function completeSingleClose(
  state: { inputValue: string | null; selectedLabel: string }, effects: SingleCloseEffects,
): void {
  effects.setMounted(false);
  effects.onOpenChangeComplete?.(false);
  effects.setQueryChanged(false);
  effects.setCloseQuery(null);
  effects.clearActiveIndex();
  if (state.inputValue !== null && state.inputValue !== state.selectedLabel) {
    effects.requestInput(state.selectedLabel,
      createChangeEventDetails(state.selectedLabel === '' ? 'input-clear' : 'none'));
  }
}
