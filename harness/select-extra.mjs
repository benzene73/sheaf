import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const engines = { chromium, firefox, webkit };
const targets = [
  {
    name: "upstream",
    url: process.env.UPSTREAM_URL || "http://localhost:4198/?fixture=select",
  },
];
if (process.env.UPSTREAM_ONLY !== "1")
  targets.push({
    name: "liveview",
    url:
      process.env.SELECT_URL || "http://localhost:4197/select?fixture=select",
  });
const scenarios = [
  {
    name: "pointer item activation accepts value",
    steps: [
      ["key", "ArrowDown", { open: true }],
      [
        "option",
        "Bravo",
        { value: "Bravo", open: false, focus: "Choose fruit" },
      ],
    ],
  },
  {
    name: "native form submits selected value",
    steps: [
      ["key", "b", { value: "Bravo", open: false }],
      ["button", "Submit", { submitted: "Bravo", submits: 1 }],
    ],
  },
  {
    name: "native reset preserves controlled value",
    steps: [
      ["key", "b", { value: "Bravo" }],
      ["button", "Reset", { value: "Bravo", formValue: "Bravo" }],
    ],
  },
  {
    name: "Tab closes and advances to submit",
    steps: [
      ["key", "ArrowDown", { open: true }],
      ["key", "Tab", { open: false, focus: "Submit", value: "" }],
    ],
  },
  {
    name: "modal outside click does not activate target",
    steps: [
      ["key", "ArrowDown", { open: true }],
      ["outside", "", { open: false, focus: "Choose fruit", outside: 0 }],
    ],
  },
  {
    name: "nonmodal outside click activates target",
    query: "&modal=false",
    steps: [
      ["key", "ArrowDown", { open: true }],
      ["outside", "", { open: false, outside: 1 }],
    ],
  },
];
function snapshot() {
  const output = (id) =>
    document.querySelector(`[data-testid="${id}"]`).textContent.trim();
  const focused = document.activeElement;
  return {
    value: output("select-value"),
    submitted: output("select-submitted-value"),
    submits: Number(output("select-submit-count")),
    outside: Number(output("select-outside-count")),
    formValue: String(
      new FormData(document.querySelector("form")).get("fruit") || "",
    ),
    open:
      document
        .querySelector('[aria-label="Choose fruit"]')
        .getAttribute("aria-expanded") === "true",
    focus:
      focused?.getAttribute("aria-label") || focused?.textContent.trim() || "",
  };
}
const results = [];
for (const browserName of (process.env.BROWSERS || "chromium").split(",")) {
  const browser = await engines[browserName].launch();
  try {
    for (const scenario of scenarios) {
      const pair = [];
      for (const target of targets) {
        const page = await browser.newPage();
        const trace = [];
        try {
          await page.goto(target.url + (scenario.query || ""));
          await page
            .locator("[data-fixture-ready=true]")
            .waitFor({ state: "attached" });
          await page.locator('[aria-label="Choose fruit"]').focus();
          for (const [action, value, expected] of scenario.steps) {
            if (action === "key") await page.keyboard.press(value);
            else if (action === "option")
              await page
                .getByRole("option", { name: value, exact: true })
                .click();
            else if (action === "button")
              await page
                .getByRole("button", { name: value, exact: true })
                .click();
            else {
              const box = await page
                .locator("button")
                .filter({ hasText: /^Outside$/ })
                .boundingBox();
              await page.mouse.click(
                box.x + box.width / 2,
                box.y + box.height / 2,
              );
            }
            const deadline = Date.now() + 3000;
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
            browser: browserName,
            target: target.name,
            scenario: scenario.name,
            pass: true,
            trace,
          });
          console.log(`PASS ${browserName} ${target.name}: ${scenario.name}`);
        } catch (error) {
          results.push({
            browser: browserName,
            target: target.name,
            scenario: scenario.name,
            pass: false,
            trace,
            actual: await page.evaluate(snapshot).catch(() => null),
            error: error.message,
          });
          console.log(`FAIL ${browserName} ${target.name}: ${scenario.name}`);
        } finally {
          await page.close();
        }
      }
      if (pair.length === 2) assert.deepEqual(pair[0], pair[1]);
    }
  } finally {
    await browser.close();
  }
}
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  process.env.REPORT_PATH || "artifacts/select-extra-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} target scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
