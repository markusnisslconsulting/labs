import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://127.0.0.1:4499/iframe.html?id=components-switch--off&viewMode=story", { waitUntil: "load" });
await page.waitForTimeout(800);
const dump = await page.evaluate(() => {
  const root = document.querySelector("[role='switch']");
  const hiddenInput = root?.querySelector("input") ?? document.querySelector(".uix-switch-row input");
  return {
    rootAriaChecked: root?.getAttribute("aria-checked"),
    hiddenInput: hiddenInput
      ? { checked: hiddenInput.checked, type: hiddenInput.type, name: hiddenInput.name || null }
      : null,
  };
});
console.log(JSON.stringify(dump));
await browser.close();
