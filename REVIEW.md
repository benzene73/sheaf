# Independent viability review

Verdict: GO for a larger isolated experiment, not production adoption or a claim
of Base UI parity.

Reviewed client.js, server.exs, PORTING.md and test.cjs. Independently reran the
eight Chromium tests against the real LiveView endpoint on port 4197: all pass,
with no captured browser JavaScript errors. Also ran a separate browser script
checking initial ArrowUp and two-stage Escape dismissal; both pass.

## Findings corrected during review

- Initial ArrowUp selected the penultimate item because index -1 participated
  in wraparound arithmetic. Initial direction is now handled explicitly.
- Escape was always consumed, preventing the containing native dialog from
  closing on the second Escape. The handler now consumes it only when the
  combobox is open.
- The original patch test changed only an output outside the combobox. The
  revised test changes rendered option attributes inside it and verifies that
  patch, focus, and the active descendant together.

## What the experiment establishes

The browser owns transient interaction and a query generation. The server owns
rendered options and the accepted hidden form value. The browser immediately
invalidates old choices before its debounce; server and client generation checks
reject late results. LiveView owns result DOM rather than a competing client
renderer. This is a credible small ownership model for the tested paths.

The rejected-selection test deliberately avoids optimistic accepted-value
mutation. It demonstrates preservation of canonical state, not rollback of an
optimistic update. That is an appropriate simplification, explicitly documented.

## Limits and next gates

- This is an independently written behavior sketch informed by Base UI tests,
  not a translation of its implementation. No paired upstream fixture ran.
- Option-patch coverage changes attributes; removal/reordering of an active
  option remains a separate test before claiming broad patch robustness.
- The endpoint rejects one value synchronously. Delayed persistence failures,
  pending submission, disconnect/reconnect and form recovery are not tested.
- Hardcoded element IDs and adjacent Kaguya dependencies are fixture shortcuts,
  not a reusable multi-instance library API.
- IME, blur/outside dismissal, disabled options, empty results, Firefox/WebKit,
  screen readers and positioning remain outside this trial.
- The test delays are controlled but use elapsed time to ensure a request was
  sent. A longer-running harness should expose request acknowledgements instead.

The strongest remaining uncertainty is generality: whether this small ownership
contract survives multiple instances, asynchronous persistence and reconnection
without special-case glue. There is no unresolved blocker in the eight exercised
paths. Passing them justifies testing those next boundaries, not migrating apps.
