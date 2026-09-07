# Combobox input lifecycle paired gate

September 7, 2026. Exact Base UI pin remains
`4d92faa1a4da6a5fe66a6194401470974fc2f8fe`.

The expanded controlled React fixture and standalone LiveView fixture pass all
nine input-lifecycle scenarios on Chromium 145, Firefox 146, and WebKit 26:
**54/54 target executions**. The original nine navigation scenarios were rerun
against the same expanded fixtures on all three engines: **54/54**.

Shared input-lifecycle coverage:

- Enter without a highlighted item closes the popup and submits the form.
- Enter with an enabled highlighted item selects without submitting.
- Enter with a disabled highlighted item neither selects nor submits.
- Canceling value change keeps the popup open and canonical value unchanged.
- Canceling only close allows acceptance while keeping the popup open.
- Escape while open restores the accepted label; subsequent closed Escape clears.
- Outside dismissal restores the accepted label after unmatched typed text.
- Home/End position the caret at start/end without changing value.
- Readonly input remains navigable but Enter cannot select or submit.

The cancellation case waits for an observable settled-policy callback count of
one before asserting unchanged state. Without that wait an asynchronous adapter
could falsely pass before rejection was processed. Both targets expose the same
counter; the LiveView adapter increments it after response effects are applied.

## Corrections discovered against the reference

Readonly does **not** prevent arrow navigation: the input key handler's guard and
the floating navigation handler are separate upstream. An initial assertion that
readonly ArrowDown cannot open was contradicted by the real fixture and corrected.
The fixture also needed a submit button, matching the upstream form test, for
native implicit submission. The Outside button is hidden from the accessibility
tree while the popup is open; the test uses its visible button text to perform a
real click rather than bypassing pointer behavior or forcing the action.

## Reproduction and limits

Run `BROWSERS=chromium,firefox,webkit node harness/lifecycle.mjs`, followed by the
same browser matrix for `harness/paired.mjs`. On PowerShell assign `$env:BROWSERS`
first. Raw outputs in this worktree are
`artifacts/lifecycle-paired-matrix.json` and
`artifacts/navigation-after-lifecycle.json`.

This suite proves these bounded observable paths. It does not establish complete
input/filter parity, callback-reason parity, IME, multiple selection, delayed
acceptance races, reconnect/patch recovery, actual mobile or screen-reader support.
LiveView asynchronous protocol races require their own adapter-specific suite.
