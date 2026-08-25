import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("https://labs.markusnissl.com/storybook/iframe.html?id=components-switch--off&viewMode=story", { waitUntil: "load" });
await page.waitForTimeout(800);
const dump = await page.evaluate(() => {
  const root = document.querySelector("[role='switch'], .uix-switch, .uix-switch-input");
  return {
    found: Boolean(root),
    tag: root?.tagName,
    role: root?.getAttribute("role"),
    ariaChecked: root?.getAttribute("aria-checked"),
    dataChecked: root?.getAttribute("data-checked"),
    class: root?.className?.toString().slice(0, 80),
    parentClass: root?.parentElement?.className?.toString().slice(0, 60),
    outer: root?.outerHTML?.slice(0, 220),
  };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
