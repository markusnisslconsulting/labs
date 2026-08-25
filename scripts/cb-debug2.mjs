import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://127.0.0.1:4477/iframe.html?id=components-combobox--supplier-region&viewMode=story", { waitUntil: "load" });
await page.waitForTimeout(400);
const info = await page.evaluate(() => {
  const input = document.querySelector("input[list]");
  const label = document.querySelector("label");
  return {
    inputId: input?.id ?? null,
    labelFor: label?.getAttribute("for") ?? null,
    labelText: label?.textContent ?? null,
    datalistOptions: [...document.querySelectorAll("datalist option")].length,
  };
});
console.log("COMBOBOX:", JSON.stringify(info));
await browser.close();
