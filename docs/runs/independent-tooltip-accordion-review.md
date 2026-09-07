# Practical Tooltip and Accordion review

Tooltip had one concrete integration defect: opening replaced existing aria-describedby tokens, closing erased them, and an unrelated LiveView patch could remove the tooltip relationship while it remained open. The adapter now merges its popup ID, tracks whether it owns that token, removes only its own contribution on close, and reapplies the relationship in updated(). Existing author-owned popup references are retained. updated() also refreshes positioning after content patches.

Strict TypeScript passes. A single actual-hook Chromium probe verified existing+tip on open, updated-help+tip after a simulated attribute patch and updated(), updated-help after close, and preservation of an initially author-owned tip token. This was a focused DOM/hook check, not a full LiveView server patch test or another multi-browser matrix.

Accordion source policies match the pinned Root.handleValueChange and Item.onOpenChange branches for the exposed single/multiple toggle behavior and callback cancellation ordering. The adapter scopes event/DOM queries to the owning data-accordion root, keeps disabled buttons focusable while rejecting activation, reasserts expanded/panel visibility on patches, and disposes its delegated listener. Native type=button gives ordinary Enter/Space activation without accidental submission. No practical blocker found in its browser-owned kept-mounted contract. Dynamic server-controlled value replacement and animated presence remain outside scope.

No further matrix recommended; proceed after the existing everyday acceptance checks.
