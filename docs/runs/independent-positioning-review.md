# Independent arrowless-positioning review

Verdict: PASS for the mapped arrowless offset/collision/size policy and five shared geometry scenarios. This is not a complete Popover primitive, modality, dismissal, nesting or mobile-device certification.

Reviewed `src/behavior/anchor-positioning.ts` against pinned Base UI `internals/useAnchorPositioning.ts`. Logical sides/offset metadata, padding normalization, flip-only preferred-side bias, flip/shift flags/order, arrowless limiter, available dimensions, DPR anchor snapping and observer configuration match the inspected branches. Floating UI performs geometry; this unit ports Base UI assembly/policy, not Floating UI itself. Omissions are explicitly mapped (arrow/origin, hidden anchors, lazy flip, inline, React lifecycle).

## Evidence

Six configuration/effect unit tests independently passed. Inspected `D:/liveview-primitives-harness/artifacts/positioning-paired-label-independent.json`:30/30 target scenarios across Chromium, Firefox and WebKit. Harness uses identical fixture sizes/styles and checks collision inset12, anchor gap8, tall top12, mobile width/height containment and resize while open. It also compares final x/y/width/height within0.75px. This is meaningful geometry evidence, not just visible-element assertions. Only one placement family/bottom-to-top fixture is exercised; logical RTL and other collision policies currently have source/unit evidence rather than equivalent browser certification.

## Scheduling issue found and corrected

Initial DOM controller guarded only final coordinates with update sequence; an older compute's size middleware could overwrite CSS variables after a newer compute. Root changed options to be created per update with a current-sequence guard for middleware writes as well. Independent controlled asynchronous experiment completes update2 before update1: fixed code preserves size22 and coords22; scratch negative copy removing sequence guard leaves size11 with coords22. Main source was not mutated for the experiment.

Promoted durable regression tests into `tests/unit/anchor-positioning-lifecycle.test.cjs`: stale completion cannot overwrite size/coords, destruction blocks pending writes and cleans observation. Both pass. These mock only asynchronous geometry completion to make scheduling order deterministic; actual geometry remains tested with real Floating UI in browser. No real browser race reproduction is claimed.

Strict TypeScript now checks both existing adapters through a narrow typed hook contract. Runtime HEEx part validation replaces unchecked null assertions; event payloads and cancellation details are typed. `npx tsc --noEmit` passes. This improves contract checking, not proof of all lifecycle behavior.
