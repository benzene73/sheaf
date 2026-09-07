/**
 * Base UI filter source translation, pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * internals/filter.ts, resolveValueLabel.tsx, serializeValue.ts;
 * combobox/root/utils/index.ts and AriaCombobox.tsx query/flat-item branches.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 */
export interface FilterOptions extends Intl.CollatorOptions { locale?: Intl.LocalesArgument; }
export interface Filter {
  contains<Item>(item: Item, query: string, itemToString?: (item: Item) => string): boolean;
  startsWith<Item>(item: Item, query: string, itemToString?: (item: Item) => string): boolean;
  endsWith<Item>(item: Item, query: string, itemToString?: (item: Item) => string): boolean;
}
function stringifyLocale(locale?: Intl.LocalesArgument): string {
  if (Array.isArray(locale)) return locale.map(value => stringifyLocale(value)).join(',');
  if (locale == null) return '';
  return String(locale);
}
export function serializeValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}
export function stringifyAsLabel<Item>(item: Item, itemToStringLabel?: (item: Item) => string): string {
  if (itemToStringLabel && item != null) return itemToStringLabel(item) ?? '';
  if (item && typeof item === 'object') {
    if ('label' in item && item.label != null) return String(item.label);
    if ('value' in item) return String(item.value);
  }
  return serializeValue(item);
}
const filterCache = new Map<string, Filter>();
export function getFilter(options: FilterOptions = {}): Filter {
  const mergedOptions: Intl.CollatorOptions = {
    usage: 'search', sensitivity: 'base', ignorePunctuation: true, ...options,
  };
  const cacheKey = `${stringifyLocale(options.locale)}|${JSON.stringify(mergedOptions)}`;
  const cachedFilter = filterCache.get(cacheKey);
  if (cachedFilter) return cachedFilter;
  const collator = new Intl.Collator(options.locale, mergedOptions);
  const filter: Filter = {
    contains(item, query, itemToString) {
      if (!query) return true;
      const itemString = stringifyAsLabel(item, itemToString);
      for (let i = 0; i <= itemString.length - query.length; i += 1) {
        if (collator.compare(itemString.slice(i, i + query.length), query) === 0) return true;
      }
      return false;
    },
    startsWith(item, query, itemToString) {
      if (!query) return true;
      const itemString = stringifyAsLabel(item, itemToString);
      return collator.compare(itemString.slice(0, query.length), query) === 0;
    },
    endsWith(item, query, itemToString) {
      if (!query) return true;
      const itemString = stringifyAsLabel(item, itemToString);
      const queryLength = query.length;
      return itemString.length >= queryLength && collator.compare(itemString.slice(itemString.length - queryLength), query) === 0;
    },
  };
  filterCache.set(cacheKey, filter);
  return filter;
}

export type FilterItemToString<Item> = ((item: Item) => string) & { selected?: (value: Item) => string };
export function createCollatorItemFilter<Item>(filter: Filter, itemToStringLabel?: FilterItemToString<Item>) {
  return (item: Item, query: string) => {
    if (item == null) return false;
    return filter.contains(item, query, itemToStringLabel);
  };
}
/** Public Combobox.useFilter's selection-aware contains helper, not Root's default. */
export function createSingleSelectionCollatorFilter<Item>(
  filter: Filter, itemToStringLabel?: FilterItemToString<Item>, selectedValue?: Item,
) {
  return (item: Item, query: string) => {
    if (item == null) return false;
    if (!query) return true;
    const selectedValueToString = itemToStringLabel?.selected ?? itemToStringLabel;
    const selectedString = selectedValue != null ? stringifyAsLabel(selectedValue, selectedValueToString) : '';
    if (selectedString && filter.contains(selectedString, query) && selectedString.length === query.length) return true;
    return filter.contains(item, query, itemToStringLabel);
  };
}
export interface ComboboxQueryState {
  open: boolean;
  closeQuery: string | null;
  inputValue: unknown;
  single: boolean;
  selectedLabel: string;
  queryChangedAfterOpen: boolean;
  filterQuery?: string;
}
/** AriaCombobox 339–350; caller owns queryChangedAfterOpen and close lifecycle. */
export function resolveComboboxFilterQuery(state: ComboboxQueryState, filter: Filter) {
  const query = !state.open && state.closeQuery !== null ? state.closeQuery : String(state.inputValue).trim();
  const shouldBypassFiltering = state.single && !state.queryChangedAfterOpen && query !== '' &&
    state.selectedLabel.length === query.length && filter.contains(state.selectedLabel, query);
  return { query, shouldBypassFiltering, filterQuery: shouldBypassFiltering ? '' : (state.filterQuery ?? query) };
}
/** AriaCombobox flat list branch; grouped/external-window lists are deliberately separate. */
export function filterFlatItems<Item>(items: readonly Item[], query: string, filter: (item: Item, query: string) => boolean, limit = -1): readonly Item[] {
  if (query === '') return limit > -1 ? items.slice(0, limit) : items;
  const limitedItems: Item[] = [];
  for (const item of items) {
    if (limit > -1 && limitedItems.length >= limit) break;
    if (filter(item, query)) limitedItems.push(item);
  }
  return limitedItems;
}
