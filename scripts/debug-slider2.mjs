import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(
  "http://127.0.0.1:4484/iframe.html?id=components-slider--reorder-buffer&viewMode=story",
  { waitUntil: "load" },
);
await page.waitForTimeout(500);
const html = await page.evaluate(
  () =>
    document.querySelector(".uix-slider")?.outerHTML?.slice(0, 700) ??
    "NOT FOUND",
);
console.log(html);
await browser.close();
