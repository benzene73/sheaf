/**
 * NumberFieldInput onChange/onBlur and Root allowed-key extraction.
 * Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import { createChangeEventDetails } from './combobox-input';
import type { NumberFieldState, NumberChangeDetails } from './number-field';
import { formatNumber } from './number-format';
import { hasNumberFormatRoundingOptions, removeFloatingPointErrors } from './number-validate';
import { parseNumber, getFormatParts, getNumberLocaleDetails, BASE_NON_NUMERIC_SYMBOLS,
  SPACE_SEPARATOR_RE, PERCENTAGES, PERMILLE, PLUS_SIGNS_WITH_ASCII, MINUS_SIGNS_WITH_ASCII,
  isNumeralChar, ANY_MINUS_DETECT_RE, FORMAT_CONTROL_DETECT_RE } from './number-parse';

export function getAllowedNumberKeys(state: NumberFieldState) {
  const { locale, format } = state;
  const parts = getFormatParts(locale, format);
  const keys = new Set<string>(BASE_NON_NUMERIC_SYMBOLS);
  const addAll = (chars: readonly string[]) => chars.forEach(char => keys.add(char));
  keys.add(parts.find(part => part.type === 'decimal')?.value ?? getNumberLocaleDetails(locale, format).decimal);
  parts.forEach(part => {
    if (['integer', 'fraction', 'exponentInteger', 'compact'].includes(part.type)) return;
    addAll(Array.from(part.value));
    if (SPACE_SEPARATOR_RE.test(part.value)) keys.add(' ');
  });
  if (format?.style === 'percent' || (format?.style === 'unit' && format.unit === 'percent')) addAll(PERCENTAGES);
  if (format?.style === 'percent' || (format?.style === 'unit' && format.unit === 'permille')) addAll(PERMILLE);
  addAll(PLUS_SIGNS_WITH_ASCII);
  if ((state.min ?? Number.MIN_SAFE_INTEGER) < 0 || state.allowOutOfRange) addAll(MINUS_SIGNS_WITH_ASCII);
  return keys;
}
export function runNumberInputChange(text: string, event: Event, state: NumberFieldState, effects: {
  setAllowInputSync(value: boolean): void; setInputValue(text: string): void;
  requestValue(value: number | null, details: NumberChangeDetails): boolean;
}) {
  if (event.defaultPrevented) return;
  effects.setAllowInputSync(false);
  if (text.trim() === '') {
    effects.setInputValue(text);
    effects.requestValue(null, createChangeEventDetails('input-clear', event));
    return;
  }
  const allowed = getAllowedNumberKeys(state);
  if (!Array.from(text).every(ch => isNumeralChar(ch) || ANY_MINUS_DETECT_RE.test(ch) || allowed.has(ch) || FORMAT_CONTROL_DETECT_RE.test(ch))) return;
  const parsed = parseNumber(text, state.locale, state.format);
  effects.setInputValue(text);
  if (parsed !== null) effects.requestValue(parsed, createChangeEventDetails('input-change', event));
}
export function runNumberInputBlur(text: string, event: Event, state: NumberFieldState & {
  disabled: boolean; readOnly: boolean; validationOnBlur: boolean;
}, effects: {
  setTouched(value: boolean): void; setFocused(value: boolean): void;
  getAllowInputSync(): boolean; setAllowInputSync(value: boolean): void; getPendingCommit(): boolean;
  requestValue(value: number | null, details: NumberChangeDetails): boolean;
  getLastChangedValue(): number | null; setBlockRevalidation(value: boolean): void;
  validateCommit(value: number | null): void;
  onValueCommitted(value: number | null, details: { reason: string; event: Event }): void;
  setInputValue(text: string): void;
}) {
  if (event.defaultPrevented || state.disabled) return;
  effects.setTouched(true); effects.setFocused(false);
  if (state.readOnly) return;
  const value = state.value;
  const manual = !effects.getAllowInputSync(), pending = effects.getPendingCommit();
  effects.setAllowInputSync(true);
  if (text.trim() === '') {
    const details = createChangeEventDetails('input-clear', event);
    effects.requestValue(null, details);
    if (details.isCanceled) return;
    if (state.validationOnBlur) effects.validateCommit(null);
    if (manual || pending || value !== null) effects.onValueCommitted(null, { reason: 'input-clear', event });
    return;
  }
  const parsed = parseNumber(text, state.locale, state.format);
  if (parsed === null) return;
  const rounding = hasNumberFormatRoundingOptions(state.format);
  const committed = !manual && !rounding ? value : rounding ? removeFloatingPointErrors(parsed, state.format) : parsed;
  const shouldUpdate = value !== committed;
  const shouldCommit = manual || shouldUpdate || pending;
  let committedValue = committed;
  if (shouldUpdate) {
    const details = createChangeEventDetails('input-blur', event);
    effects.setBlockRevalidation(true);
    effects.requestValue(committed, details);
    if (details.isCanceled) { effects.setBlockRevalidation(false); return; }
    committedValue = effects.getLastChangedValue();
    if (committedValue === value) effects.setBlockRevalidation(false);
  }
  if (state.validationOnBlur) effects.validateCommit(committedValue);
  if (shouldCommit) effects.onValueCommitted(committedValue, { reason: 'input-blur', event });
  const canonical = formatNumber(committedValue, state.locale, state.format);
  if (text !== canonical) effects.setInputValue(canonical);
}
