import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 200)));
await page.goto("http://127.0.0.1:4495/iframe.html?id=components-switch--off&viewMode=story", { waitUntil: "load" });
await page.waitForTimeout(800);
const dump = await page.evaluate(() => {
  const root = document.querySelector(".uix-switch");
  return {
    found: Boolean(root),
    outer: root?.outerHTML ?? null,
    bg: root ? getComputedStyle(root).backgroundColor : null,
    bodyStart: document.body.innerHTML.slice(0, 150),
  };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
