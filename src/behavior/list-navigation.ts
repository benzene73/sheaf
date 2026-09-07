/**
 * Adapted from Base UI 4d92faa1a4da6a5fe66a6194401470974fc2f8fe:
 * packages/react/src/floating-ui-react/utils/composite.ts and
 * packages/react/src/floating-ui-react/hooks/useListNavigation.ts.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 * Scope and exact mappings: docs/upstream-mapping/list-navigation.md.
 */
export type DisabledIndices = ReadonlyArray<number> | ((index: number) => boolean);
type ItemList = ReadonlyArray<HTMLElement | null>;

export function isHiddenByStyles(styles: CSSStyleDeclaration) {
  return styles.visibility === 'hidden' || styles.visibility === 'collapse';
}

export function isElementVisible(
  element: Element | null,
  styles: CSSStyleDeclaration | null = element
    ? element.ownerDocument.defaultView!.getComputedStyle(element)
    : null,
) {
  if (!element || !element.isConnected || !styles || isHiddenByStyles(styles)) {
    return false;
  }
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility();
  }
  return styles.display !== 'none' && styles.display !== 'contents';
}

export function isListIndexDisabled(list: ItemList, index: number, disabledIndices?: DisabledIndices) {
  const isExplicitlyDisabled = typeof disabledIndices === 'function'
    ? disabledIndices(index)
    : (disabledIndices?.includes(index) ?? false);
  if (isExplicitlyDisabled) return true;
  const element = list[index];
  if (!element) return false;
  if (!isElementVisible(element)) return true;
  // Native disabled items cannot receive focus even with explicit enabled indices.
  if (element.matches(':disabled')) return true;
  return !disabledIndices &&
    (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true');
}

export function findNonDisabledListIndex(
  list: ItemList,
  { startingIndex = -1, decrement = false, disabledIndices, amount = 1 }: {
    startingIndex?: number;
    decrement?: boolean;
    disabledIndices?: DisabledIndices;
    amount?: number;
  } = {},
): number {
  let index = startingIndex;
  do {
    index += decrement ? -amount : amount;
  } while (index >= 0 && index <= list.length - 1 && isListIndexDisabled(list, index, disabledIndices));
  return index;
}

export function getMinListIndex(list: ItemList, disabledIndices?: DisabledIndices) {
  return findNonDisabledListIndex(list, { disabledIndices });
}

export function getMaxListIndex(list: ItemList, disabledIndices?: DisabledIndices) {
  return findNonDisabledListIndex(list, { decrement: true, startingIndex: list.length, disabledIndices });
}

export function isIndexOutOfListBounds(list: ItemList, index: number) {
  return index < 0 || index >= list.length;
}

/** Opening branch: deliberately ignores disabledIndices, exactly as upstream. */
export function getOpeningListIndex(list: ItemList, key: string | null) {
  return key == null || key === 'ArrowDown' || key === 'Enter' || key === ' ' || key === ''
    ? getMinListIndex(list)
    : getMaxListIndex(list);
}

export interface ListNavigationOptions {
  list: ItemList;
  currentIndex: number;
  key: string;
  loopFocus?: boolean;
  allowEscape?: boolean;
  typeable?: boolean;
  disabledIndices?: DisabledIndices;
}

/**
 * Pure extraction of commonOnKeyDown's vertical, virtual, non-grid branch.
 * null means key not handled; -1 means no highlighted option (input remains focused).
 * Host owns event cancellation, open lifecycle, DOM rendering and scroll scheduling.
 */
export function navigateList({
  list, currentIndex, key, loopFocus = true, allowEscape = false,
  typeable = true, disabledIndices,
}: ListNavigationOptions): number | null {
  const minIndex = getMinListIndex(list, disabledIndices);
  const maxIndex = getMaxListIndex(list, disabledIndices);
  if (!typeable && key === 'Home') return minIndex;
  if (!typeable && key === 'End') return maxIndex;
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return null;
  let index = currentIndex;
  if (key === 'ArrowDown') {
    if (loopFocus) {
      if (currentIndex >= maxIndex) {
        if (allowEscape && currentIndex !== list.length) {
          index = -1;
        } else {
          index = minIndex;
        }
      } else {
        index = findNonDisabledListIndex(list, { startingIndex: currentIndex, disabledIndices });
      }
    } else {
      index = Math.min(maxIndex,
        findNonDisabledListIndex(list, { startingIndex: currentIndex, disabledIndices }));
    }
  } else if (loopFocus) {
    if (currentIndex <= minIndex) {
      if (allowEscape && currentIndex !== -1) {
        index = list.length;
      } else {
        index = maxIndex;
      }
    } else {
      index = findNonDisabledListIndex(list, { startingIndex: currentIndex, decrement: true, disabledIndices });
    }
  } else {
    index = Math.max(minIndex,
      findNonDisabledListIndex(list, { startingIndex: currentIndex, decrement: true, disabledIndices }));
  }
  if (isIndexOutOfListBounds(list, index)) index = -1;
  return index;
}
