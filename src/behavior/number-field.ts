/**
 * NumberFieldRoot setValue/incrementValue source extraction, single input.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails, type ChangeEventDetails } from './combobox-input';
import { toValidatedNumber } from './number-validate';
import { formatNumber } from './number-format';
export type NumberChangeDetails = ChangeEventDetails & { direction?: 1 | -1 };
export interface NumberFieldState {
  value: number | null; min?: number; max?: number; step?: number | 'any'; smallStep?: number; largeStep?: number;
  allowOutOfRange?: boolean; snapOnStep?: boolean; locale?: Intl.LocalesArgument; format?: Intl.NumberFormatOptions;
  initialValue: number | null;
}
export function getNumberStep(state: NumberFieldState, event?: { altKey?: boolean; shiftKey?: boolean }) {
  if (event?.altKey) return state.smallStep ?? 0.1;
  if (event?.shiftKey) return state.largeStep ?? 10;
  return state.step === 'any' ? 1 : state.step ?? 1;
}
export function requestNumberValue(unvalidated: number | null, details: NumberChangeDetails, state: NumberFieldState, effects: {
  getAllowInputSync(): boolean; onValueChange?(value: number | null, details: NumberChangeDetails): void;
  assignValue(value: number | null): void; setDirty(dirty: boolean): void; markPendingCommit(): void;
  setLastChangedValue(value: number | null): void; setInputValue(text: string): void; forceRender(): void;
}) {
  const event = details.event as Event & { altKey?: boolean; shiftKey?: boolean };
  const dir = details.direction;
  const inputReason = details.reason.startsWith('input-') || details.reason === 'none';
  const validated = toValidatedNumber(unvalidated, dir ? getNumberStep(state, event) * dir : undefined,
    state.min ?? Number.MIN_SAFE_INTEGER, state.max ?? Number.MAX_SAFE_INTEGER, state.min ?? 0,
    state.format, state.snapOnStep ?? false, event?.altKey ?? false, !state.allowOutOfRange || !inputReason);
  const changed = validated !== state.value ||
    (inputReason && (unvalidated !== state.value || effects.getAllowInputSync() === false));
  if (changed) {
    effects.onValueChange?.(validated, details);
    if (details.isCanceled) return false;
    effects.assignValue(validated);
    effects.setDirty(validated !== state.initialValue);
    effects.markPendingCommit();
  }
  effects.setLastChangedValue(validated);
  if (effects.getAllowInputSync()) effects.setInputValue(formatNumber(validated, state.locale, state.format));
  effects.forceRender();
  return changed;
}
export function incrementNumberValue(amount: number, options: {
  direction: 1 | -1; currentValue?: number | null; storedValue: number | null; event?: Event; reason: string;
}, request: (value: number | null, details: NumberChangeDetails) => boolean) {
  const previous = options.currentValue == null ? options.storedValue : options.currentValue;
  if (typeof previous !== 'number') return request(0, createChangeEventDetails(options.reason, options.event));
  return request(previous + amount * options.direction,
    createChangeEventDetails(options.reason, options.event, undefined, { direction: options.direction }));
}
