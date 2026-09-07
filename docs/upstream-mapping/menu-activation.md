# Non-native item activation

`src/behavior/menu-activation.ts` extracts the non-native, non-link composite
branch of `useButton.ts:116–175` after `useMenuItemCommonProps.ts:64–68` at Base UI
commit `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

Space during typeahead prevents default before button activation. Disabled
items, events from descendants, unrelated keys and previously prevented events
do not activate. Eligible Enter/Space prevents default and invokes the item's
click action. Select composes its own `runSelectItemKey` before this shared
button branch, matching its source consumer.

The shared Menu browser scenarios exercise Enter, Space, typeahead Space and
disabled items. Select exercises enabled/disabled Enter. Native buttons, links,
pointer drag eligibility and full `useButton` semantics are not this extraction.
