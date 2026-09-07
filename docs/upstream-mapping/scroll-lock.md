# Document scroll-lock translation

Pin Base UI `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.
Source: `packages/utils/src/useScrollLock.ts` (full imperative locking branches),
`packages/react/src/utils/useAnchoredPopupScrollLock.ts` width decision, platform
os.ios/engine.webkit expressions. MIT notice: `licenses/BASE-UI-MIT.txt`.

## Source behavior retained

`acquireScrollLock(referenceElementOrDocument)` returns a release function. First
acquisition schedules lock with timeout0; last release schedules restoration with
timeout0, retaining upstream close/reopen handoff semantics.

Viewport scroller is html if it establishes its own overflow container, otherwise
body. Existing author/non-library hidden/clip lock is left untouched and watched
by MutationObserver on all html/body attributes. When released, this lock takes
over; it does not snapshot and later resurrect the unrelated lock.

Overlay-scrollbar branch saves/restores overflow longhands on the effective
scroller. Inset branch preserves scrollbar-gutter (including both-edges), probes
stable gutter support, and either locks the effective scroller or uses upstream's
body sizing/scroll transfer fallback. Original html/body styles and scroll position
restore on release. Resize performs cleanup then a new lock on animation frame.
WebKit pinch zoom exception and iOS overlay-scrollbar selection are retained.

`shouldLockAnchoredPopup(enabled,touchOpen,positioner)` retains exact width rule:
non-touch locks when enabled; touch locks only when popup width is positive and
within20px of the document layout viewport width. MenuPositioner.tsx:267–275
enables for open && (menubarModal || (modal && reason != trigger-hover)). Touch
open method is separate from pointer availability; never infer it solely from a
device supporting touch. The original hook recomputes on relevant state/element
changes, not a ResizeObserver; no stronger resize policy is claimed here.

## Explicit adapter improvements

Upstream uses a module singleton ScrollLocker and module-global inset snapshots.
The port uses a WeakMap keyed by Document, with snapshots inside each active
document's lock closure. This prevents one iframe lock overwriting another's
restoration state. Release is idempotent to tolerate repeated hook cleanup; upstream
release decrements directly. These are deliberate changes, not literal parity.

DOM owner window supplies timers, MutationObserver, requestAnimationFrame, CSS
and navigator. Platform expressions match upstream production detection; the
development-only navigator.userAgentData preference is unnecessary for the two
flags used here. The port adds no iOS workaround beyond upstream behavior.

## Verification

Run `node tests/unit/scroll-lock.browser.cjs`.
18/18 standalone browser checks pass: six in each Chromium, Firefox, WebKit.
Cases: nested lock ownership/exact inline restoration; independent iframe locks;
author-class lock handoff; duplicate release and immediate close/reacquire; html
overflow scroller; exact20px touch-width threshold. Artifact:
`artifacts/scroll-lock-results.json`.

Firefox iframe resize revealed the source's cleanup→rAF-relock interval. The
test waits for relock after parent viewport restoration rather than falsely
requiring synchronous persistence across that documented resize interval.

These are standalone port checks, not paired upstream Menu tests. Actual physical
iOS navbar, pinch zoom and every forced inset/gutter fallback remain unverified.
No claim that all scrolling is prevented by every browser follows from style
restoration tests; paired wheel/scroll interaction should validate Menu integration.

Upstream consumer tests: MenuRoot.test.tsx:1755 scroll-lock suite (mouse lock,
touch narrow exemption, touch full-width lock); ComboboxRoot.test.tsx:4598;
Menubar.test.tsx:789 including touch menu handoff. These should be the paired
oracle for subsequent component integration.
