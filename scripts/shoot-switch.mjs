import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
await page.goto(
  "https://labs.markusnissl.com/storybook/iframe.html?id=components-switch--off&viewMode=story",
  { waitUntil: "networkidle" },
);
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/switch-off.png" });
const state = await page.evaluate(() => {
  const root = document.querySelector(".uix-switch");
  return {
    dataChecked: root?.getAttribute("data-checked"),
    ariaChecked: root?.getAttribute("aria-checked"),
    trackBg: root ? getComputedStyle(root).background.slice(0, 60) : null,
  };
});
console.log("OFF:", JSON.stringify(state));
await browser.close();
