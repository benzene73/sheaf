# Bounded list navigation translation

Pin: Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
License: `licenses/BASE-UI-MIT.txt` (upstream MIT notice copied unchanged).

This unit is an extraction/translation of actual source branches, not a new
algorithm inferred from documentation. It is not the whole `useListNavigation`
hook or a complete Combobox port.

| Upstream source | Translation |
| --- | --- |
| `floating-ui-react/utils/composite.ts`: `findNonDisabledListIndex` | Same do/while index scan and sentinel behavior |
| Same file: `getMinListIndex`, `getMaxListIndex` | React ref argument replaced by readonly DOM list |
| Same file: `isListIndexDisabled`, `isHiddenByStyles`, `isElementVisible` | Same precedence and browser visibility logic; Floating UI getComputedStyle call replaced by element's owner window |
| `floating-ui-react/hooks/useListNavigation.ts`: initial sync lines 435–445 | `getOpeningListIndex`; vertical, non-nested case, skips disabled attributes even with explicit indices |
| Same file: `commonOnKeyDown`, lines 568–686 | `navigateList`: vertical, virtual, non-grid branch extracted, React ref reads/writes become input and return value |

Host adapter must open/show the list before scanning visible elements, supply
`allowEscape: loopFocus && !autoHighlightMode` for the editable Combobox, and keep input focused.
`AriaCombobox.tsx` also supplies `disabledIndices: EMPTY_ARRAY`: aria-disabled
items remain highlightable during navigation, while selection rejects them.
Opening still uses the separate scan that skips disabled attributes. Both the
paired browser run and independent source review caught this consumer setting;
the algorithm alone cannot determine the right policy for each component.
The input is part of upstream's default loop: last → none → first, rather than
last → first. `null` means a key is unhandled; `-1` means no active descendant.
On first keyboard opening, use `getOpeningListIndex`; a closed ArrowUp must open
at the last eligible option even when `loopFocus` is false.

## Upstream tests and translated checks

- `combobox/root/ComboboxRoot.test.tsx`, `prop: loopFocus` (12615–12798):
  both default input-inclusive loops and disabled looping clamping.
- `floating-ui-react/utils/composite.test.ts`: hidden/collapsed styles, fallback
  without checkVisibility, native-disabled precedence over explicit indices.
- `floating-ui-react/hooks/useListNavigation.test.tsx`: disabled-first and
  hidden-first cases around 264–289 explain why opening ignores explicit indices.
- Local `tests/unit/list-navigation.test.cjs`: direct algorithm/sentinel cases
  with element doubles. These do not certify real browser layout/visibility.
- Paired upstream React/LiveView browser cases are maintained independently by
  the harness agent. Their run artifacts, rather than this map, establish results.

## Required negative control

Change the extracted forward loop branch's `index = -1` to `index = minIndex`.
The shared last → ArrowDown → none scenario must fail only for the port. Restore
the original source and rerun. This detects the historical trial's direct-loop
behavior and proves the shared harness distinguishes that incompatibility.

## Deliberate boundaries

Not translated here: React effects, pointer modality, scroll scheduling,
virtualizer delays, nested tree notifications, horizontal/RTL/grid navigation,
item selection, input filtering, open/dismissal policy, async acceptance or
LiveView patches. The host currently implements those separately; only mapped
branches above count as ported source. Subsequent ports must have separate maps.

When there are no eligible opening items, the raw opening helper can return an
out-of-bounds sentinel as upstream does. The host must not publish that value as
an aria-activedescendant. Arrow navigation itself normalizes out-of-bounds to -1.
Non-typeable Home/End also return the raw min/max sentinel; their host must check
that the returned row exists. That branch is not part of the initial paired
editable-combobox gate.
