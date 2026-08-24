import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });

// 1) Storybook: dark theme via toolbar globals (localStorage persistiert)
await page.goto(
  "https://labs.markusnissl.com/storybook/iframe.html?id=components-button--matrix&viewMode=story",
  { waitUntil: "networkidle" },
);
await page.evaluate(() => {
  document.documentElement.dataset.theme = "dark";
  document.documentElement.dataset.density = "compact";
});
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/matrix-dark-compact.png" });

// 2) StatusPill + Chip nach dem Fix
await page.goto(
  "https://labs.markusnissl.com/storybook/iframe.html?id=components-statuspill--all-tones&viewMode=story",
  { waitUntil: "networkidle" },
);
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/pills.png" });

await page.goto(
  "https://labs.markusnissl.com/storybook/iframe.html?id=components-chip--static-tag&viewMode=story",
  { waitUntil: "networkidle" },
);
await page.waitForTimeout(300);
await page.screenshot({ path: "/tmp/chip.png" });

// 3) Lab-Demo auf der Site (Panel/Buttons nach der Migration)
await page.goto("https://labs.markusnissl.com/chat-box", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/site-chatbox.png", fullPage: false });

await browser.close();
console.log("theme shots done");
