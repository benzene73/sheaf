/**
 * Base UI Toggle.tsx click and ToggleGroup.tsx setGroupValue extraction.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';
export function requestToggleGroupValue<Value>(value: Value, nextPressed: boolean, details: ChangeEventDetails,
  state: { multiple: boolean; values: readonly Value[] }, effects: {
    onValueChange?(values: Value[], details: ChangeEventDetails): void; assignValues(values: Value[]): void;
  }) {
  let next: Value[];
  if (state.multiple) {
    next = state.values.slice();
    if (nextPressed) next.push(value);
    else next.splice(state.values.indexOf(value), 1);
  } else next = nextPressed ? [value] : [];
  effects.onValueChange?.(next, details);
  if (details.isCanceled) return;
  effects.assignValues(next);
}
/** Native disabled/useButton guards run before this handler. */
export function runToggleClick<Value>(event: Event, state: { value?: Value; pressed: boolean }, effects: {
  onPressedChange?(pressed: boolean, details: ChangeEventDetails): void;
  requestGroupValue?(value: Value, pressed: boolean, details: ChangeEventDetails): void;
  assignPressed(pressed: boolean): void;
}) {
  const next = !state.pressed;
  const details = createChangeEventDetails('none', event);
  effects.onPressedChange?.(next, details);
  if (details.isCanceled) return;
  if (state.value) effects.requestGroupValue?.(state.value, next, details);
  if (details.isCanceled) return;
  effects.assignPressed(next);
}
