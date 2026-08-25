import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });

// 1) Switch OFF — track grau, knob links
await page.goto("https://labs.markusnissl.com/storybook/iframe.html?id=components-switch--off&viewMode=story", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/switch-off-fixed.png" });
const off = await page.evaluate(() => {
  const root = document.querySelector(".uix-switch");
  return { dataChecked: root?.getAttribute("data-checked"), bg: root ? getComputedStyle(root).backgroundColor : null };
});
console.log("SWITCH OFF:", JSON.stringify(off));

// 2) Focus story — Ring komplett mit Padding?
await page.goto("https://labs.markusnissl.com/storybook/iframe.html?id=foundations-focus--keyboard-ring&viewMode=story", { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/focus-padded.png" });

// 3) Tooltip mit System-Button
await page.goto("https://labs.markusnissl.com/storybook/iframe.html?id=components-tooltip--on-button&viewMode=story", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.hover("button");
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/tooltip-button.png" });

await browser.close();
console.log("done");
