# Independent bounded Select review

Source inspected: Base UI pin `4d92faa1a4da6a5fe66a6194401470974fc2f8fe`, `select/root/SelectRoot.tsx`, `select/item/SelectItem.tsx`, `select/trigger/SelectTrigger.tsx`, and `internals/use-button/useButton.ts`; lab `behavior/select.ts`, `liveview/native-select.ts`, and `lib/lab/select_live.ex`.

## Verdict

The extracted single-value selection and typeahead policy is faithful within its declared scope. Browser integration acceptance is pending the paired executable suite; this source review alone is not a parity claim. I independently ran `node --test tests/unit/select.test.cjs`: 10/10 passed.

Select-specific distinctions are preserved: canceled value assignment still independently requests close; closed typeahead commits whereas open typeahead only highlights; read-only permits open browsing but prevents committing; attribute-only disabled filtering keeps hidden force-mounted options searchable; arrow navigation allows disabled highlight while activation rejects it; selected index wins on keyboard opening.

The reused non-native composite activation helper matches the actual div role=option fixture: Enter/Space on the current target, disabled rejection, defaultPrevented rejection, and typing Space prevention before activation. It does not port arbitrary native-button/link rendering, external Base UI handler-prevention composition, or pointer drag eligibility, and the mapping correctly excludes those branches.

## Findings sent to implementation owner

1. **Mount failure, fixed during review.** Constructing typeahead immediately reads getState before the popup controller exists. Initial code dereferenced `this.controller.open`. Current code guards it with `this.controller?.open ?? false`, which is the correct initial closed state. A mounted browser gate must still exercise this integration.
2. **Modal fixture option not consumed at inspection.** The server now exposes data-modal and a conditional backdrop; the adapter initially hardcodes modal=true. The controller must consume the same option before nonmodal outside-press parity is claimed.
3. **Trigger semantics.** Upstream SelectTrigger supplies role=combobox. The new fixture initially supplies only a button with aria-haspopup=listbox, which loses the select-only combobox role. This is an accessibility mismatch even if click tests pass.
4. **Form reset is not automatic canonical reset.** A hidden input and native reset button alone do not reset accepted hook/server state. The new form fixture needs an explicit reset contract if reset is part of the shared suite. Asynchronous validation is explicitly excluded and should remain excluded.

## Limits and next gate

The fixture uses alignItemWithTrigger=false; Base UI's default item-aligned positioning is excluded. Pointer down/drag/hover policy, roving tabindex (upstream highlighted option gets tabindex=0), touch selection, multiple values, field validation/autofill, and arbitrary option replacement are not covered by this source verdict. Source unit coverage is useful because it checks observable cancellation/order and mode differences, but cannot certify focus, native-popover toggles, form state, or LiveView patch timing. The paired browser gate should retain those distinctions rather than standardize Select into Combobox behavior.

## Follow-up evidence

The implementation owner reports the shared Select gate passed 60/60. Modal getter now consumes data-modal and trigger role=combobox is added; those source findings are closed. Form reset requires an important correction to the initial caution above: the actual controlled Base UI fixture preserves Bravo and FormData Bravo on reset. Therefore matching controlled-state preservation does not require a reset listener, and absence of one is not a demonstrated defect. Additional form/modal browser evidence remains a separate gate.
