# Locale-aware filtering extraction

Pin Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
MIT notice in `licenses/BASE-UI-MIT.txt`.

`src/behavior/filter.ts` translates `internals/filter.ts` getFilter and its
closure cache; `utils/stringifyLocale.ts`; `serializeValue.ts`;
`resolveValueLabel.tsx` stringifyAsLabel only; Combobox root utils' two collator
filter factories; AriaCombobox.tsx:339–350 query bypass and :403–425 flat filtering.
`useFilteredItems.ts` is only a React context selector, not the filtering engine.

## Integration API

`getFilter({locale?, ...Intl.CollatorOptions})` returns contains, startsWith,
endsWith. Defaults usage=search, sensitivity=base, ignorePunctuation=true; caller
overrides spread last. Locale defaults to runtime. Do not lowercase query/item
before calling. Labels use custom mapper, non-null object label, object value,
then upstream serializeValue fallback. React element labels are not ported.

Root's default uses `createCollatorItemFilter(getFilter(...), mapper)` AFTER
`resolveComboboxFilterQuery(state, filter)`. The latter trims query, preserves
closing query while closed, and bypasses filtering if a single selection label
matches a same-length query AND queryChangedAfterOpen is false. Typing the
selected label after opening must not accidentally bypass filtering.

`createSingleSelectionCollatorFilter` is also translated but represents PUBLIC
Combobox.useFilter contains behavior. It does not know queryChangedAfterOpen and
is not a replacement for Root's state-dependent bypass rule.

`filterFlatItems(items, query, predicate, limit=-1)` retains source early-limit
behavior and returns original readonly array for empty unlimited query. Do not
mutate that shared array. Grouped items, external-window projection, collection
membership and server result acceptance remain separate, unported branches.

## Tests and limits

Upstream `internals/filter.test.ts` checks separate Intl.Locale cache entries;
`combobox/root/utils/useFilter.test.tsx` checks defaults and single/multiple
selection matching. Eleven local tests additionally exercise real Intl.Collator,
Turkish I, accent options, label mapping, bypass state and limits. Browser fixtures
must separately compare source component behavior with the LiveView adapter.

There is **no explicit Unicode normalization** or grapheme-aware sliding window
in upstream. contains slices exactly query.length UTF16 code units. Thus some
decomposed-accent/ligature/punctuation length differences do not match even with
base sensitivity/ignorePunctuation. Example café vs cafe+combining acute returns
false, as does contains(co-op,coop). startsWith can differ because its slice is
shorter than an overlong query. These upstream limitations are preserved, not
silently improved or presented as complete Unicode search support.

The upstream cache has no eviction. Unique options/locale configurations remain
cached for the module lifetime; the normal application has a small stable set.
Async remote search is a LiveView adapter extension and is not supplied by this
filter utility or the useFilteredItems hook.
