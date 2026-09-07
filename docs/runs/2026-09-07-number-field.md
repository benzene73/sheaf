# Everyday NumberField gate

Six shared scenarios passed 12/12 target executions in Chromium: decimal typing
and blur formatting, increment/decrement buttons, bounds clamping on blur, empty
value, ArrowUp/ArrowDown stepping, and native form submission. The controlled
fixture uses initial value 10, min 0, max 100, step 0.5, en-US locale, maximum two
fraction digits, and the field name amount. Raw report is
`artifacts/number-field-paired-chromium.json`.

This verifies the everyday bounded adapter, not all NumberField behavior. Scrub,
wheel, press-and-hold, arbitrary locales, and all precision combinations are not
covered. The upstream input exposes a textbox role rather than spinbutton; the
driver uses the shared accessible label Amount.
