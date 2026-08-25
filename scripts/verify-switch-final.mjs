import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
// Cache busten: Query-Parameter an die Chunk-URLs hängt Playwright selbst nicht an,
// aber ein frischer Browser-Kontext ohne Cache tut es.
await page.goto("http://127.0.0.1:4494/storybook/iframe.html?id=components-switch--off&viewMode=story", { waitUntil: "load" });
await page.waitForTimeout(800);
const dump = await page.evaluate(() => {
  const root = document.querySelector("[role='switch']");
  return {
    ariaChecked: root?.getAttribute("aria-checked"),
    dataChecked: root?.getAttribute("data-checked"),
    trackBg: root ? getComputedStyle(root).backgroundColor : null,
  };
});
console.log("OFF live:", JSON.stringify(dump));
await browser.close();
