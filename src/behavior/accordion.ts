/**
 * AccordionRoot.handleValueChange and AccordionItem.onOpenChange extraction.
 * Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
import {createChangeEventDetails, type ChangeEventDetails} from './combobox-input';

export function requestAccordionValue<Value>(value: readonly Value[], multiple: boolean,
  item: Value, nextOpen: boolean, details: ChangeEventDetails, callbacks: {
    onValueChange?(value: Value[], details: ChangeEventDetails): void;
    assignValue(value: Value[]): void;
  }) {
  let nextValue: Value[];
  if (!multiple) nextValue = value[0] === item ? [] : [item];
  else if (nextOpen) { nextValue = value.slice(); nextValue.push(item); }
  else nextValue = value.filter(current => current !== item);
  callbacks.onValueChange?.(nextValue, details);
  if (details.isCanceled) return;
  callbacks.assignValue(nextValue);
}

export function activateAccordionItem(open: boolean, event: Event, callbacks: {
  onOpenChange?(open: boolean, details: ChangeEventDetails): void;
  requestValue(open: boolean, details: ChangeEventDetails): void;
}) {
  const nextOpen = !open;
  const details = createChangeEventDetails('trigger-press', event);
  callbacks.onOpenChange?.(nextOpen, details);
  if (details.isCanceled) return;
  callbacks.requestValue(nextOpen, details);
}
