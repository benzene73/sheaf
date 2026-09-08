# Phoenix forms and composition integration

The library now defaults Combobox, Select and NumberField to ordinary Phoenix
forms. `field` normalization is shared; custom option/menu content retains a
separate semantic label. Combobox async approval and Select/NumberField observer
events are explicit opt-ins. The demo consumes the root library through a real
Mix path dependency. See `../api-policy.md` and the separate packaging report.

The `/forms` workflow exercises all three controls in a single `phx-change` /
`phx-submit` form, with no special selection handlers. Chromium checks passed:

- Custom VN content preserves its canonical ID and accessible label.
- Combo, Select and NumberField serialize and save through the normal form.
- Server validation is visible and linked through input ARIA.
- Server replacement and reset reconcile all three controls.
- Native reset restores the combobox's rendered baseline and clears its draft.
- Menu typeahead uses its semantic label rather than icons/subtitles.

The first workflow run exposed the custom combobox option's missing explicit
accessible name; the helper now supplies it. Source review also found that
unnamed draft inputs can trigger Phoenix form events, so form mode stops those
draft events while emitting canonical backing-control events.

Ten affected existing suites passed: paired, label-combobox, lifecycle, select,
number-field, menu, menu-form, components, nested and bridge-isolation. This is
not a rerun of the entire prior browser matrix. Raw reports are ignored under
`artifacts/current/`, and the new workflow report is `artifacts/forms.json`.

Independent review found stale NumberField constraints after server patches.
The hook now refreshes min/max/step/locale/format while preserving source initial
value semantics and active drafts. A focused actual-hook Chromium probe verified
changed step, max clamp/button state, locale formatting and draft preservation.
A focused Combobox lifecycle unit check verifies that a server acknowledgement
does not erase newer query/IME text while genuine replacement still reconciles.

TypeScript, the private client/declaration build, 112 JavaScript unit tests,
three conventional ExUnit form-field tests, WSL formatting, and root/demo
compilation passed. Browser scope remains Chromium only. No packages were
published and no Kaguya/Nila application code or data was changed.

This proves library integration through a realistic demo consumer, not a shipped
production migration. Physical IME/mobile/assistive-technology certification and
unimplemented Base UI variants remain outside this gate.
