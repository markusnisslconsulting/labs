import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`the consulting and coaching comparison loads local fonts and remains usable in ${theme}`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(
      `/storybook/iframe.html?id=foundations-brands--comparison&viewMode=story&globals=theme:${theme}`,
    );
    const consulting = page.getByRole("region", {
      name: "Consulting",
      exact: true,
    });
    await expect(consulting).toBeVisible();
    await page.waitForFunction(
      (theme) => document.documentElement.dataset.theme === theme,
      theme,
    );
    const fonts = await page.evaluate(async () => {
      const body = await document.fonts.load(
        '400 16px "Atkinson Hyperlegible"',
        "Harbour",
      );
      const bold = await document.fonts.load(
        '700 16px "Atkinson Hyperlegible"',
        "Harbour",
      );
      const italic = await document.fonts.load(
        'italic 400 16px "Atkinson Hyperlegible"',
        "Harbour",
      );
      const display = await document.fonts.load(
        '700 28px "Bricolage Grotesque"',
        "Harbour",
      );
      return [body, bold, italic, display].map(
        (faces) =>
          faces.length > 0 && faces.every((face) => face.status === "loaded"),
      );
    });
    expect(fonts).toEqual([true, true, true, true]);
    await expect(consulting.locator('[data-face="display"]')).toHaveCSS(
      "font-family",
      /Bricolage Grotesque/,
    );
    await expect(consulting.locator('[data-face="body"]')).toHaveCSS(
      "font-family",
      /Atkinson Hyperlegible/,
    );
    await expect(
      page
        .getByRole("region", { name: "Coaching", exact: true })
        .locator('[data-face="display"]'),
    ).not.toHaveCSS("font-family", /Bricolage Grotesque/);
    await page.keyboard.press("Tab");
    await expect(
      consulting.getByRole("textbox", { name: "Workshop name", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      consulting.getByRole("button", { name: "Save example", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(consulting.getByRole("status")).toHaveText(
      "Example saved locally.",
    );
    await page.keyboard.press("Tab");
    await expect(
      consulting.getByRole("button", { name: "Reset", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(consulting.getByRole("status")).toHaveText(
      "No changes saved.",
    );
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1);
    expect(requests.some((url) => /\.woff2(?:\?|$)/.test(url))).toBe(true);
    expect(
      requests.filter((url) => /fonts\.googleapis|fonts\.gstatic/.test(url)),
    ).toEqual([]);
  });
}

test("the assembled site loads the consulting faces and ships readable font licenses", async ({
  page,
  request,
}) => {
  await page.goto("/components");
  await expect(
    page.getByRole("heading", { name: "Components", exact: true }),
  ).toHaveCSS("font-family", /Bricolage Grotesque/);
  await expect(page.locator("body")).toHaveCSS(
    "font-family",
    /Atkinson Hyperlegible/,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.goto(
    "/storybook/iframe.html?id=foundations-brands--docs&viewMode=docs",
  );
  for (const family of ["Atkinson Hyperlegible", "Bricolage Grotesque"]) {
    const link = page.getByRole("link", {
      name: `${family} license`,
      exact: true,
    });
    await expect(link).toHaveAttribute("target", "_blank");
    const url = new URL((await link.getAttribute("href"))!, page.url()).href;
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(
      "SIL OPEN FONT LICENSE Version 1.1",
    );
  }
});
