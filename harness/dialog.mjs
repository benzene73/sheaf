import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const targets = [
  {
    name: "upstream",
    url: process.env.UPSTREAM_URL || "http://localhost:4198/?fixture=dialog",
  },
];
if (process.env.UPSTREAM_ONLY !== "1")
  targets.push({
    name: "liveview",
    url:
      process.env.DIALOG_URL || "http://localhost:4197/dialog?fixture=dialog",
  });
const scenarios = [
  {
    name: "keyboard opening focuses Name and Escape restores trigger",
    steps: [
      ["key", "Enter", { open: true, focus: "Name" }],
      ["key", "Escape", { open: false, focus: "trigger" }],
    ],
  },
  {
    name: "Close control closes and dialog can reopen",
    steps: [
      ["key", "Enter", { focus: "Name" }],
      ["button", "Close", { open: false, focus: "trigger" }],
      ["key", "Enter", { open: true, focus: "Name" }],
    ],
  },
  {
    name: "editing and saving form preserves open dialog",
    steps: [
      ["key", "Enter", { focus: "Name" }],
      ["fill", "Ada", { name: "Ada" }],
      ["button", "Save", { open: true, saves: 1, saved: "Ada" }],
    ],
  },
  {
    name: "background pointer dismisses without activating outside control",
    steps: [
      ["key", "Enter", { focus: "Name" }],
      ["outside", "", { open: false, focus: "trigger", outside: 0 }],
    ],
  },
  {
    name: "disabled pointer dismissal still permits Escape",
    query: "&disablePointerDismissal=true",
    steps: [
      ["key", "Enter", { focus: "Name" }],
      ["outside", "", { open: true, outside: 0 }],
      ["key", "Escape", { open: false, focus: "trigger" }],
    ],
  },
  {
    name: "canceled close remains open for Escape and Close control",
    query: "&cancelClose=true",
    steps: [
      ["key", "Enter", { focus: "Name" }],
      ["key", "Escape", { open: true, requests: 1 }],
      ["button", "Close", { open: true, requests: 2 }],
    ],
  },
];
function snapshot() {
  const trigger = document.querySelector("[data-testid=dialog-trigger]");
  const dialog = [...document.querySelectorAll("[role=dialog],dialog")].find(
    (e) =>
      e.getAttribute("aria-label") === "Dialog fixture" && e.checkVisibility(),
  );
  const active = document.activeElement;
  const out = (id) =>
    document.querySelector(`[data-testid="${id}"]`).textContent.trim();
  return {
    open: !!dialog,
    focus:
      active === trigger
        ? "trigger"
        : active?.getAttribute("name") === "name"
          ? "Name"
          : active?.textContent.trim(),
    name: dialog?.querySelector("input")?.value || "",
    saved: out("dialog-saved-name"),
    saves: Number(out("dialog-save-count")),
    outside: Number(out("outside-click-count")),
    requests: Number(out("dialog-close-requests")),
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
        await page.locator("[data-testid=dialog-trigger]").focus();
        for (const [action, value, expected] of scenario.steps) {
          if (action === "key") await page.keyboard.press(value);
          else if (action === "fill")
            await page.getByRole("textbox", { name: "Name" }).fill(value);
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
  process.env.REPORT_PATH || "artifacts/dialog-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} target scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
