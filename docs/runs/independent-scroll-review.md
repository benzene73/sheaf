# Independent scroll-lock review

Verdict: bounded source translation and ownership checks PASS. Not proof of universal scroll prevention, physical mobile behavior or complete Menu modality.

Compared scroll-lock.ts with pinned Base UI utils/useScrollLock.ts and anchored width policy. Effective html/body scroller, external owner observation, deferred first acquisition/final restoration, inset/overlay branch, gutter probing, resize cleanup/relock, WebKit zoom exception and platform expressions preserve the inspected policy. Per-document WeakMap/snapshots and idempotent release are explicit improvements over upstream singleton/global snapshot state, not silent claims of exact implementation identity.

Independently reran `node tests/unit/scroll-lock.browser.cjs`:18/18 on Chromium/Firefox/WebKit. Added ignored adversarial runner `artifacts/reviewer-scroll-extra.cjs`: original18 plus release while waiting for author lock and reacquire before deferred unlock,24/24 total. Release-before-owner-handoff does not relock later; a new owner arriving before deferred unlock keeps the lock until its own release. Exact inline-style restoration, nested ownership and iframe independence are covered by existing cases.

No leak/reentrancy defect found in those paths. Timer guards avoid locking at count0; external-owner observer is disposed via restore; inset resize frame is canceled on final release. MutationObserver observes html/body attributes only, as upstream does: external style changes driven solely by stylesheet replacement/media changes are not a stronger supported handoff mechanism. Concurrent independent code rewriting the same owned inline properties while locked remains a general ownership boundary.

Tests primarily establish CSS state/restoration/ownership, not physical touch or wheel prevention. Actual iOS collapsed navbar, pinch zoom, every forced inset fallback and nested unrelated overlays remain unverified. NativeMenu's hook integration must be measured with a shared wheel/scroll case before claiming actual Menu scroll parity. No emergency source issue found.
