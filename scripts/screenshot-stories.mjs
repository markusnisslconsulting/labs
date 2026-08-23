import { chromium } from "@playwright/test";

const shots = [
  ["demos-agent-stream--default", "agent-stream"],
  ["demos-undo-machine--default", "undo-machine"],
  ["demos-ordering-desk--default", "ordering-desk"],
  ["demos-built-in-apis--default", "built-in-apis"],
  ["components-button--all-variants", "button-variants"],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
for (const [id, name] of shots) {
  await page.goto(
    `https://labs.markusnissl.com/storybook/iframe.html?id=${id}&viewMode=story`,
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/sb-${name}.png`, fullPage: true });
  console.log("shot", name);
}
await browser.close();
