import { chromium, firefox, webkit } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const engines = { chromium, firefox, webkit };
const results = [];
for (const browserName of (process.env.BROWSERS || "chromium").split(",")) {
  const browser = await engines[browserName].launch();
  async function run(name, fn, query = "") {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.goto(
        (process.env.LIVEVIEW_URL || "http://localhost:4197/paired") + query,
      );
      await page
        .locator("[data-fixture-ready=true]")
        .waitFor({ state: "attached" });
      await page.getByRole("combobox", { name: "Fruit" }).focus();
      await fn(page);
      assert.deepEqual(errors, []);
      results.push({ browser: browserName, name, pass: true });
      console.log(`PASS ${browserName}: ${name}`);
    } catch (error) {
      results.push({
        browser: browserName,
        name,
        pass: false,
        error: error.message,
        errors,
      });
      console.log(`FAIL ${browserName}: ${name}`);
    } finally {
      await page.close();
    }
  }
  const invoke = (p, id) => p.locator(id).evaluate((el) => el.click()); // server fixture action without an unrelated pointer dismissal
  const tick = (p) =>
    p.waitForFunction(
      () => document.querySelector("#paired-tick").textContent === "1",
    );
  const focus = (p) =>
    p.getByRole("combobox").evaluate((el) => document.activeElement === el);
  const active = (p) =>
    p.getByRole("combobox").getAttribute("aria-activedescendant");
  const count = (p, id, value) =>
    p.waitForFunction(
      ({ id, value }) =>
        Number(document.querySelector(`[data-testid="${id}"]`).textContent) ===
        value,
      { id, value },
    );
  await run(
    "option patch preserves ongoing composition DOM and deferred query",
    async (p) => {
      const input = p.getByRole("combobox");
      await input.dispatchEvent("compositionstart", { data: "" });
      await input.evaluate((el) => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set.call(el, "ch");
        el.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: "insertCompositionText",
            data: "ch",
          }),
        );
      });
      await p.waitForFunction(
        () =>
          document
            .querySelector("[role=combobox]")
            .getAttribute("aria-expanded") === "true",
      );
      await invoke(p, "#paired-patch");
      await tick(p);
      assert.equal(await input.inputValue(), "ch");
      assert.equal(await focus(p), true);
      assert.deepEqual(await p.getByRole("option").allTextContents(), [
        "Apple",
        "Banana",
        "Cherry",
      ]);
      await input.dispatchEvent("compositionend", { data: "ch" });
      await p.waitForFunction(
        () =>
          [...document.querySelectorAll("[role=option]")].filter((e) =>
            e.checkVisibility(),
          ).length === 1,
      );
      assert.deepEqual(await p.getByRole("option").allTextContents(), [
        "Cherry",
      ]);
    },
  );
  await run(
    "removing highlighted row clears dangling active descendant",
    async (p) => {
      await p.keyboard.press("ArrowUp");
      await p.waitForFunction(
        () =>
          document
            .querySelector("[role=combobox]")
            .getAttribute("aria-activedescendant") === "fruit-Cherry",
      );
      await invoke(p, "#paired-remove-option");
      await tick(p);
      assert.equal(await active(p), null);
      assert.equal(await focus(p), true);
      await p.keyboard.press("ArrowDown");
      assert.equal(await active(p), "fruit-Apple");
    },
  );
  await run(
    "same-count row replacement clears old identity and navigates new row",
    async (p) => {
      await p.keyboard.press("ArrowUp");
      await p.waitForFunction(
        () =>
          document
            .querySelector("[role=combobox]")
            .getAttribute("aria-activedescendant") === "fruit-Cherry",
      );
      await invoke(p, "#paired-replace-option");
      await tick(p);
      assert.equal(await active(p), null);
      assert.equal(await focus(p), true);
      await p.keyboard.press("ArrowUp");
      assert.equal(await active(p), "fruit-Date");
    },
  );
  await run(
    "destroy and remount isolate pending proposal ownership",
    async (p) => {
      await p.keyboard.press("ArrowDown");
      await p.keyboard.press("Enter");
      await count(p, "pending-request", 1);
      const old = await p.locator("#fruit-combobox").elementHandle();
      await invoke(p, "#paired-unmount");
      await p.locator("#fruit-combobox").waitFor({ state: "detached" });
      await invoke(p, "#paired-mount");
      await p
        .locator("#fruit-combobox[data-fixture-ready=true]")
        .waitFor({ state: "attached" });
      assert.equal(await old.evaluate((el) => el.isConnected), false);
      await p.getByRole("combobox").focus();
      await p.keyboard.press("ArrowUp");
      await p.keyboard.press("Enter");
      await count(p, "settled-count", 2);
      await p.waitForFunction(
        () =>
          document.querySelector("[data-testid=accepted-value]").textContent ===
          "Cherry",
      );
      assert.equal(await p.getByRole("combobox").inputValue(), "Cherry");
      assert.equal(
        await p.getByRole("combobox").getAttribute("aria-expanded"),
        "false",
      );
    },
    "?reverse=true",
  );
  await browser.close();
}
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  process.env.REPORT_PATH || "artifacts/liveview-lifecycle-results.json",
  JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
);
console.log(
  `${results.filter((r) => r.pass).length}/${results.length} scenarios passed`,
);
if (results.some((r) => !r.pass)) process.exitCode = 1;
