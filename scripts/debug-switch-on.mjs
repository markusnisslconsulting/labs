import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
for (const story of ["off", "on"]) {
  await page.goto(`http://127.0.0.1:4499/iframe.html?id=components-switch--${story}&viewMode=story`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => {
    const root = document.querySelector("[role='switch']");
    return { ariaChecked: root?.getAttribute("aria-checked"), dataChecked: root?.hasAttribute("data-checked") };
  });
  console.log(story, JSON.stringify(state));
}
await browser.close();
