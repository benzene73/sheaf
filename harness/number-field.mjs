import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const targets = [
  {
    name: "upstream",
    url:
      process.env.UPSTREAM_URL || "http://localhost:4198/?fixture=number-field",
  },
];
if (process.env.UPSTREAM_ONLY !== "1")
  targets.push({
    name: "liveview",
    url:
      process.env.NUMBER_URL ||
      "http://localhost:4197/number-field?fixture=number-field",
  });
const scenarios = [
  {
    name: "decimal text formats on blur",
    steps: [
      ["fill", "12.50", {}],
      ["button", "Outside", { input: "12.5", value: "12.5" }],
    ],
  },
  {
    name: "increment and decrement honor fractional step",
    steps: [
      ["button", "Increase", { input: "10.5", value: "10.5" }],
      ["button", "Decrease", { input: "10", value: "10" }],
    ],
  },
  {
    name: "blur clamps values to bounds",
    steps: [
      ["fill", "999", {}],
      ["button", "Outside", { input: "100", value: "100" }],
      ["fill", "-9", {}],
      ["button", "Outside", { input: "0", value: "0" }],
    ],
  },
  {
    name: "empty text yields null value",
    steps: [
      ["fill", "", {}],
      ["button", "Outside", { input: "", value: "" }],
    ],
  },
  {
    name: "arrow keys step the value",
    steps: [
      ["key", "ArrowUp", { input: "10.5", value: "10.5" }],
      ["key", "ArrowDown", { input: "10", value: "10" }],
    ],
  },
  {
    name: "native form submits numeric value",
    steps: [
      ["fill", "12.5", {}],
      ["button", "Submit", { submitted: "12.5", submits: 1 }],
    ],
  },
];
function snapshot() {
  const out = (id) =>
    document.querySelector(`[data-testid="${id}"]`).textContent.trim();
  return {
    input: document.querySelector("[aria-label=Amount]").value,
    value: out("number-value"),
    submitted: out("number-submitted-value"),
    submits: Number(out("number-submit-count")),
  };
}
const results = [];
const browser = await chromium.launch();
try {
  for (const scenario of scenarios) {
    const pair = [];
    for (const target of targets) {
      const page = await browser.newPage();
      const trace = [];
      try {
        await page.goto(target.url);
        await page
          .locator("[data-fixture-ready=true]")
          .waitFor({ state: "attached" });
        await page.getByRole("textbox", { name: "Amount" }).focus();
        for (const [action, value, expected] of scenario.steps) {
          if (action === "fill")
            await page.getByRole("textbox", { name: "Amount" }).fill(value);
          else if (action === "key") await page.keyboard.press(value);
          else
            await page
              .getByRole("button", { name: value, exact: true })
              .click();
          const deadline = Date.now() + 2500;
          let actual;
          do {
            actual = await page.evaluate(snapshot);
            if (Object.entries(expected).every(([k, v]) => actual[k] === v))
              break;
            await page.evaluate(
              () => new Promise((resolve) => requestAnimationFrame(resolve)),
            );
          } while (Date.now() < deadline);
          for (const [k, v] of Object.entries(expected))
            assert.deepEqual(actual[k], v, k);
          trace.push(
            Object.fromEntries(
              Object.keys(expected).map((k) => [k, actual[k]]),
            ),
          );
        }
        pair.push(trace);
        results.push({
          browser: "chromium",
          target: target.name,
          scenario: scenario.name,
          pass: true,
          trace,
        });
        console.log(`PASS ${target.name}: ${scenario.name}`);
      } catch (error) {
        results.push({
          browser: "chromium",
          target: target.name,
          scenario: scenario.name,
          pass: false,
          trace,
          actual: await page.evaluate(snapshot).catch(() => null),
          error: error.message,
        });
        console.log(`FAIL ${target.name}: ${scenario.name}`);
      } finally {
        await page.close();
      }
    }
    if (pair.length === 2) assert.deepEqual(pair[0], pair[1]);
  }
} finally {
  await browser.close();
}
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  process.env.REPORT_PATH || "artifacts/number-field-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} target scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
