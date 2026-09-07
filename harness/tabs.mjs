import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const targets = [
  {
    name: "upstream",
    url: process.env.UPSTREAM_URL || "http://localhost:4198/?fixture=tabs",
  },
];
if (process.env.UPSTREAM_ONLY !== "1")
  targets.push({
    name: "liveview",
    url: process.env.TABS_URL || "http://localhost:4197/tabs?fixture=tabs",
  });
const scenarios = [
  {
    name: "pointer selects Reviews panel",
    steps: [
      ["click", "Reviews", { selected: "Reviews", panel: "Reviews panel" }],
    ],
  },
  {
    name: "manual arrows focus disabled and wrap without selection",
    steps: [
      ["key", "ArrowRight", { focus: "Disabled", selected: "Overview" }],
      ["key", "Enter", { focus: "Disabled", selected: "Overview" }],
      ["key", "ArrowRight", { focus: "Reviews", selected: "Overview" }],
      ["key", "ArrowRight", { focus: "Overview", selected: "Overview" }],
    ],
  },
  {
    name: "Home and End move focus to enabled endpoints",
    steps: [
      ["key", "End", { focus: "Reviews", selected: "Overview" }],
      ["key", "Home", { focus: "Overview", selected: "Overview" }],
    ],
  },
  {
    name: "manual Enter and Space activate focused tabs",
    steps: [
      ["key", "ArrowRight", { focus: "Disabled", selected: "Overview" }],
      ["key", "Enter", { focus: "Disabled", selected: "Overview" }],
      ["key", "ArrowRight", { focus: "Reviews", selected: "Overview" }],
      ["key", "Enter", { selected: "Reviews", panel: "Reviews panel" }],
      ["key", "ArrowLeft", { focus: "Disabled", selected: "Reviews" }],
      ["key", "ArrowLeft", { focus: "Overview", selected: "Reviews" }],
      ["key", "Space", { selected: "Overview", panel: "Overview panel" }],
    ],
  },
  {
    name: "activateOnFocus selects during arrow navigation",
    query: "&auto=true",
    steps: [
      ["key", "ArrowRight", { focus: "Disabled", selected: "Overview" }],
      [
        "key",
        "ArrowRight",
        { selected: "Reviews", focus: "Reviews", panel: "Reviews panel" },
      ],
    ],
  },
  {
    name: "selected panel is linked and has one tab stop",
    steps: [
      ["observe", "", { linked: true, tabStops: ["Overview"] }],
      ["click", "Reviews", { linked: true, tabStops: ["Reviews"] }],
    ],
  },
];
function snapshot() {
  const tabs = [...document.querySelectorAll("[role=tab]")];
  const selected = tabs.find((e) => e.getAttribute("aria-selected") === "true");
  const panel = [...document.querySelectorAll("[role=tabpanel]")].find((e) =>
    e.checkVisibility(),
  );
  return {
    selected: selected?.textContent.trim(),
    focus:
      document.activeElement?.getAttribute("role") === "tab"
        ? document.activeElement.textContent.trim()
        : null,
    panel: panel?.textContent.trim(),
    linked:
      !!panel &&
      selected?.getAttribute("aria-controls") === panel.id &&
      panel.getAttribute("aria-labelledby") === selected.id,
    tabStops: tabs
      .filter((e) => e.tabIndex === 0)
      .map((e) => e.textContent.trim()),
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
        await page.goto(target.url + (scenario.query || ""));
        await page
          .locator("[data-fixture-ready=true]")
          .waitFor({ state: "attached" });
        await page.getByRole("tab", { name: "Overview", exact: true }).focus();
        for (const [action, value, expected] of scenario.steps) {
          if (action === "key") await page.keyboard.press(value);
          else if (action === "click")
            await page.getByRole("tab", { name: value, exact: true }).click();
          const deadline = Date.now() + 2500;
          let actual;
          do {
            actual = await page.evaluate(snapshot);
            if (
              Object.entries(expected).every(
                ([k, v]) => JSON.stringify(actual[k]) === JSON.stringify(v),
              )
            )
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
  process.env.REPORT_PATH || "artifacts/tabs-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} target scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;

