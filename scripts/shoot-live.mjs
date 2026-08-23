import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });

await page.goto(
  "https://labs.markusnissl.com/storybook/iframe.html?id=components-button--matrix&viewMode=story",
  { waitUntil: "networkidle" },
);
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/matrix.png", fullPage: true });

await page.goto("https://labs.markusnissl.com/chat-box", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/lab-chatbox.png", fullPage: true });

await browser.close();
console.log("shots done");
