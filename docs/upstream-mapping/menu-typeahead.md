# Menu typeahead extraction and consumer contract

Pin Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
`src/behavior/menu-typeahead.ts` translates
`floating-ui-react/hooks/useTypeahead.ts` matching, session and timeout branches.
MIT notice retained in `licenses/BASE-UI-MIT.txt`.

## Source translation

React `stringRef`, `prevIndexRef`, `matchIndexRef` become closure variables.
State is read fresh through getState rather than useStableCallback/useState.
Injected timer.start/clear replaces useTimeout, preserving its replacement/clear
semantics. Default is **500ms**, because MenuRoot.tsx:520 passes
TYPEAHEAD_RESET_MS from internals/constants.ts:3; generic hook defaults750ms.

The matching algorithm is retained: normalized start index, non-locale lowercase,
prefix scan, visibility/native-disabled/explicit-disabled filtering, repeated
letter cycling unless an available double-letter label exists, unmatched-query
reset, and space continuation during an existing session. New sessions start
after selectedIndex or current activeIndex; continued sessions keep the captured
start. Timeout clears the prefix and publishes typing=false.

`onBlur(withinComposite)` translates the branch AFTER upstream's shadow-aware
reference/popup containment check. Host must supply that containment result.
`sync()` translates the effect when open/selectedIndex changes; call it when
either changes. `destroy()` stops owned timer and makes future calls inert.

## API

```
createMenuTypeahead({ getState, onMatch, onTyping?, resetMs?, timer? })
  -> { onKeyDown, onBlur, sync, destroy }
```

State: labels, optional corresponding elements, activeIndex, open, optional
selectedIndex/disabledIndices/enabled. MenuRoot's onMatch itself only assigns
activeIndex when open and index differs; the host must preserve that policy.
No `disabledIndices` is supplied by MenuRoot typeahead, so aria-disabled items
can be matched. Native-disabled or hidden elements cannot. Item activation must
separately reject disabled items.

## Other Menu behavior is not this unit

MenuRoot.tsx:492 supplies useListNavigation with virtual=false,
disabledIndices=EMPTY_ARRAY, loopFocus=true by default and vertical orientation.
Reuse extracted navigateList with typeable=false, allowEscape=false,
disabledIndices=[]: Home/End reach endpoints and arrows wrap directly, unlike
Combobox's input-inclusive loop. Opening still skips disabled endpoints.
Actual DOM focus must follow navigation; aria-activedescendant is not the Menu
focus model. Container-focused initial navigation has a separate upstream reset
branch; host must explicitly handle first/last eligible item there.

MenuPopup.tsx:114–141 delegates return focus and initial focus to
FloatingFocusManager, non-modal for normal root Menu. Escape belongs to
useDismiss. Tab/focus guards, item-click close, disabled activation, nested menu
tree dismissal and outside press are separate units. They are NOT implemented
or certified by this typeahead extraction. Native popover dismissal does not
automatically reproduce their semantics.

## Test anchors and scope

`useTypeahead.test.tsx`: repeated-first-letter :129, double-letter :145,
current-active cycling :158, capslock :204, non-locale :214, typing :292,
hidden :307, hidden-double-letter :317 and visibility:hidden :336.
Eleven local unit cases exercise matching/session behavior with explicit fake
timer; no arbitrary sleep. Browser Menu fixture comparison is separate evidence.

Known upstream limitation retained: available double-letter labels disable rapid
first-letter cycling globally. Also the open/selectedIndex effect clears timer
and prefix without emitting onTyping(false), matching upstream; consumers must
not mistake this extraction for a redesigned typing-state API.
