import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const engines = { chromium, firefox, webkit };
const targets = [
  {
    name: "upstream",
    url:
      process.env.UPSTREAM_URL ||
      "http://localhost:4198/?fixture=popover&behavior=true&size=normal",
  },
];
if (process.env.UPSTREAM_ONLY !== "1")
  targets.push({
    name: "liveview",
    url:
      process.env.POSITIONING_URL ||
      "http://localhost:4197/positioning?fixture=popover&behavior=true&size=normal",
  });
const scenarios = [
  {
    name: "keyboard open focuses first interactive child",
    steps: [["key", "Enter", { open: true, focus: "Inside" }]],
  },
  {
    name: "Tab moves between popup controls",
    steps: [
      ["key", "Enter", { focus: "Inside" }],
      ["key", "Tab", { open: true, focus: "Last" }],
    ],
  },
  {
    name: "Escape closes and returns anchor focus",
    steps: [
      ["key", "Enter", { focus: "Inside" }],
      ["key", "Escape", { open: false, focus: "anchor" }],
    ],
  },
  {
    name: "inside action keeps popup open",
    steps: [
      ["key", "Enter", { focus: "Inside" }],
      ["button", "Inside", { open: true, actions: 1 }],
    ],
  },
  {
    name: "nonmodal outside press activates outside target",
    steps: [
      ["key", "Enter", { focus: "Inside" }],
      ["outside", "", { open: false, outside: 1 }],
    ],
  },
  {
    name: "modal outside press dismisses without activating target",
    query: "&modal=true",
    steps: [
      ["key", "Enter", { focus: "Inside" }],
      ["outside", "", { open: false, outside: 0, focus: "anchor" }],
    ],
  },
];
function snapshot() {
  const anchor = document.querySelector("[data-testid=anchor]");
  const active = document.activeElement;
  return {
    open: anchor.getAttribute("aria-expanded") === "true",
    focus: active === anchor ? "anchor" : active?.textContent.trim(),
    actions: Number(
      document.querySelector("[data-testid=popover-action-count]").textContent,
    ),
    outside: Number(
      document.querySelector("[data-testid=outside-click-count]").textContent,
    ),
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
          await page.locator("[data-testid=anchor]").focus();
          for (const [action, value, expected] of scenario.steps) {
            if (action === "key") await page.keyboard.press(value);
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
  process.env.REPORT_PATH || "artifacts/popover-behavior-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} target scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
