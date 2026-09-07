/**
 * ComboboxInput.tsx composition/change branches translated from Base UI
 * 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 * Single selection, input outside popup. Root query derivation remains separate.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';

export interface ComboboxChangeState {
  disabled: boolean;
  readOnly: boolean;
  open: boolean;
  openOnInputClick: boolean;
  activeIndex: number | null;
  autoHighlightEnabled: boolean;
}
export interface ComboboxChangeEvent {
  currentTarget: { value: string };
  nativeEvent: Event;
}
export interface ComboboxChangeOptions {
  getState(): ComboboxChangeState;
  android: boolean;
  setComposingValue(value: string | null): void;
  requestInput(value: string, details: ChangeEventDetails): void;
  requestValue(value: null, details: ChangeEventDetails): void;
  requestOpen(value: boolean, details: ChangeEventDetails): void;
  /** Upstream clears active AND selected indices, preserving modality reason. */
  clearHighlight(): void;
}
export function createComboboxChangeController(options: ComboboxChangeOptions) {
  let isComposing = false;
  return {
    onCompositionStart(event: ComboboxChangeEvent) {
      if (options.android) return;
      isComposing = true;
      options.setComposingValue(event.currentTarget.value);
    },
    onCompositionEnd(event: ComboboxChangeEvent) {
      isComposing = false;
      const next = event.currentTarget.value;
      options.setComposingValue(null);
      options.requestInput(next, createChangeEventDetails('input-change', event.nativeEvent));
    },
    onChange(event: ComboboxChangeEvent) {
      const { readOnly, disabled, open, autoHighlightEnabled } = options.getState();
      const nativeEvent = event.nativeEvent;
      const inputType = (nativeEvent as InputEvent).inputType;
      const autofillLikeInput = !inputType || inputType === 'insertReplacementText';
      const shouldOpenOnInput = isComposing || !autofillLikeInput;
      function maybeOpenOnInput(trimmed: string) {
        if (readOnly || disabled || !trimmed || !shouldOpenOnInput) return;
        options.requestOpen(true, createChangeEventDetails('input-change', nativeEvent));
        if (!autoHighlightEnabled) options.clearHighlight();
      }
      if (isComposing) {
        const nextValue = event.currentTarget.value;
        options.setComposingValue(nextValue);
        if (nextValue === '' && !options.getState().openOnInputClick) {
          options.requestOpen(false, createChangeEventDetails('input-clear', nativeEvent));
        }
        const trimmed = nextValue.trim();
        const shouldMaintainHighlight = autoHighlightEnabled && trimmed !== '';
        maybeOpenOnInput(trimmed);
        if (open && options.getState().activeIndex !== null && !shouldMaintainHighlight) options.clearHighlight();
        return;
      }
      const inputChangeDetails = createChangeEventDetails('input-change', nativeEvent);
      options.requestInput(event.currentTarget.value, inputChangeDetails);
      if (inputChangeDetails.isCanceled) return;
      const empty = event.currentTarget.value === '';
      const clearDetails = createChangeEventDetails('input-clear', nativeEvent);
      if (empty) {
        options.requestValue(null, clearDetails);
        if (!options.getState().openOnInputClick) options.requestOpen(false, clearDetails);
      }
      maybeOpenOnInput(event.currentTarget.value.trim());
      if (open && options.getState().activeIndex !== null && !autoHighlightEnabled) options.clearHighlight();
    },
  };
}
