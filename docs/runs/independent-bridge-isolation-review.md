# Independent multi-instance LiveView bridge review

## Demonstrated defect

The original PortedCombobox protocol has per-hook request/generation counters but broadcasts selection_result without a component identifier. Two hooks both start at request 1 / generation 0. A reply for one is therefore accepted by the other when both have pending proposals.

`harness/bridge-isolation.mjs` bundles the actual adapter source and mounts two real hooks in browser DOM, using a minimal broadcast handleEvent transport instead of a Phoenix server. Keyboard interaction proposes Apple in A and Cherry in B. Broadcasting only A's accepted Apple reply makes both hooks accept/display Apple and consumes B's pending Cherry proposal. This fails the isolation assertion in Chromium, Firefox and WebKit (3/3 reproduced). Artifact `artifacts/bridge-isolation-before.json` retains the failure. This is an actual-hook browser regression, not an end-to-end LiveView transport test or a React parity comparison.

## Smallest explicit contract

Every select and intent request must carry a component_id equal to its unique rendered hook DOM ID. Every reply must echo it. The hook rejects foreign component IDs before reading or mutating its pending continuation. The server validates component IDs against rendered/authorized instances and stores accepted value, intent generation and latest request independently per component. Replacing only the client guard would leave sibling server intents and selected state colliding.

Lifetime is a separate boundary: destroying/recreating the same DOM ID resets local counters. Delayed replies from its previous lifetime can then match new counters. An instance token echoed in the protocol, with corresponding server lifetime policy, closes that risk; alternatively explicitly exclude remount overlap from the bounded contract. Dead-object guards alone do not protect the newly mounted object.

The server state map should not be keyed by arbitrary unchecked client IDs, and an instance token is a correlation identifier, not authorization. This is integration infrastructure specific to asynchronous LiveView acceptance, not behavior translated from Base UI.

## Verification after fix

Rerun the executable regression against current source, preserving the initial failing artifact. A stronger end-to-end fixture should exercise independent sibling acceptance, sibling intent cancellation, and reverse-delivery ordering on one real LiveView, plus same-ID remount if lifetime protection is claimed. The current probe proves the client broadcast failure only; server-map correctness needs its own test.

## Fixed-source verification

After component ID and per-mount instance correlation landed, the actual-hook Chromium regression passes sibling isolation and same-ID destroy/remount stale-reply rejection. A valid reply for the replacement instance then completes normally. The harness now defaults to Chromium and accepts BROWSERS. This closes the demonstrated client issue; the single-component fixture guard is not evidence of a reusable multi-component server state map.
