import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const engines = { chromium, firefox, webkit };
const targets = [
  {
    name: "upstream",
    url: process.env.UPSTREAM_URL || "http://localhost:4198/",
  },
];
if (process.env.UPSTREAM_ONLY !== "1")
  targets.push({
    name: "liveview",
    url: process.env.LIVEVIEW_URL || "http://localhost:4197/paired",
  });
function snapshot() {
  const input = document.querySelector("[role=combobox]");
  return {
    input: input.value,
    open: input.getAttribute("aria-expanded") === "true",
    accepted: document
      .querySelector("[data-testid=accepted-value]")
      .textContent.trim(),
    options: [...document.querySelectorAll("[role=option]")]
      .filter((el) => el.checkVisibility())
      .map((el) => el.textContent.trim()),
  };
}
async function observe(page, expected) {
  const deadline = Date.now() + 3000;
  let actual;
  do {
    actual = await page.evaluate(snapshot);
    if (
      Object.entries(expected).every(
        ([key, value]) => JSON.stringify(actual[key]) === JSON.stringify(value),
      )
    )
      break;
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(resolve)),
    );
  } while (Date.now() < deadline);
  for (const [key, value] of Object.entries(expected))
    assert.deepEqual(actual[key], value, key);
  return actual;
}
async function inputEvent(page, value, inputType) {
  await page.locator("[role=combobox]").evaluate(
    (input, { value, inputType }) => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set.call(input, value);
      input.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType, data: value }),
      );
    },
    { value, inputType },
  );
}
const scenarios = [
  {
    name: "canceled input change restores displayed value",
    query: "?cancelInput=true",
    async run(page) {
      await page.getByRole("combobox", { name: "Fruit" }).fill("Cherry");
      return [await observe(page, { input: "", accepted: "", open: false })];
    },
  },
  {
    name: "canceled composition end restores canonical input",
    query: "?cancelInput=true",
    async run(page) {
      await page.locator("[role=combobox]").dispatchEvent("compositionstart", { data: "" });
      await inputEvent(page, "ch", "insertCompositionText");
      const during = await observe(page, { input: "ch", open: true, options: ["Apple", "Banana", "Cherry"] });
      await page.locator("[role=combobox]").dispatchEvent("compositionend", { data: "ch" });
      return [during, await observe(page, { input: "", open: true, options: ["Apple", "Banana", "Cherry"] })];
    },
  },
  {
    name: "clearing selected text clears canonical selection",
    query: "?defaultValue=Apple",
    async run(page) {
      await page.getByRole("combobox", { name: "Fruit" }).fill("");
      return [await observe(page, { input: "", accepted: "", open: false })];
    },
  },
  {
    name: "replacement-text autofill does not open popup",
    async run(page) {
      await inputEvent(page, "Cherry", "insertReplacementText");
      return [
        await observe(page, { input: "Cherry", open: false, accepted: "" }),
      ];
    },
  },
  {
    name: "composition defers filtering until composition end",
    async run(page) {
      await page
        .locator("[role=combobox]")
        .dispatchEvent("compositionstart", { data: "" });
      await inputEvent(page, "ch", "insertCompositionText");
      const during = await observe(page, {
        input: "ch",
        open: true,
        options: ["Apple", "Banana", "Cherry"],
      });
      await page
        .locator("[role=combobox]")
        .dispatchEvent("compositionend", { data: "ch" });
      return [
        during,
        await observe(page, { input: "ch", open: true, options: ["Cherry"] }),
      ];
    },
  },
];
const results = [];
for (const browserName of (process.env.BROWSERS || "chromium").split(",")) {
  const browser = await engines[browserName].launch();
  try {
    for (const scenario of scenarios) {
      const pair = [];
      for (const target of targets) {
        const page = await browser.newPage();
        try {
          await page.goto(target.url + (scenario.query || ""));
          await page
            .locator("[data-fixture-ready=true]")
            .waitFor({ state: "attached" });
          await page.getByRole("combobox", { name: "Fruit" }).focus();
          const trace = await scenario.run(page);
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
  process.env.REPORT_PATH || "artifacts/composition-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} target scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
