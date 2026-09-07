# Independent NumberField practical review

Reviewed browser-owned NumberField adapter, example form and translated request/change/blur policies. Numeric validation, format precision and bounds are delegated to the mapped source helpers. Invalid-character input is restored from the retained draft; hidden canonical form value is refreshed with browser state. updated() reapplies that state after observer-server patches, consistent with the explicitly uncontrolled browser-owned contract. Controlled external updates are not claimed.

## Small ordinary-use fixes reported

The stepper click currently emits change but does not emit commit. Commit only occurs on input blur, which normally happens before the button's click changes the value. A mouse-only increment therefore never delivers the documented commit notification. Pinned useNumberFieldStepperButton.ts:130-150 explicitly commits after a changed click; its press-and-hold branch separately commits on stop. The current no-hold adapter needs the simple click completion path, not the whole press-and-hold engine.

The example stepper buttons lack upstream tabindex=-1 and aria-controls (same source :123-128). This introduces unnecessary sequential keyboard stops when input arrows already provide stepping. Finally, data-step="any" is coerced to NaN even though the behavior state supports "any"; preserve that sentinel or clearly expose only numeric steps.

No new matrix recommended. Fix these small integration details, complete the existing everyday Chromium cases, and proceed. Full field validation, wheel/scrub/hold interactions and server-controlled replacement values remain outside scope.

Resolution: the adapter now commits changed click/keyboard steps, retains `step="any"`,
and the reusable helper supplies tabindex=-1 and aria-controls on stepper buttons.
The ordinary paired NumberField gate passed 12/12 target scenarios before the
final integration pass. Hold-repeat remains omitted.
