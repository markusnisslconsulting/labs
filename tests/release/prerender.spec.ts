import { expect, test } from "@playwright/test";
import { readManifest } from "./manifest";

test("initial route documents have distinct content, canonical metadata and identity assets without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  const titles = new Set<string>();
  try {
    for (const route of readManifest().routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
      const title = await page.title();
      expect(title).toContain(await heading.innerText());
      expect(titles.has(title), route).toBe(false);
      titles.add(title);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://labs.markusnissl.com${route}`,
      );
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
        "content",
        "index, follow",
      );
      const description = await page
        .locator('head meta[name="description"]')
        .getAttribute("content");
      expect(description?.length).toBeGreaterThan(30);
      await expect(
        page.locator('head meta[property="og:description"]'),
      ).toHaveAttribute("content", description!);
      await expect(
        page.locator('head meta[property="og:title"]'),
      ).toHaveAttribute("content", title);
      await expect(
        page.locator('head meta[name="twitter:title"]'),
      ).toHaveAttribute("content", title);
      await expect(
        page.locator('head meta[name="twitter:card"]'),
      ).toHaveAttribute("content", "summary");
      await expect(
        page.locator('head meta[property="og:url"]'),
      ).toHaveAttribute("content", `https://labs.markusnissl.com${route}`);
      const image = await page
        .locator('head meta[property="og:image"]')
        .getAttribute("content");
      expect(image).toBe("https://labs.markusnissl.com/logo.webp");
      const logo = await context.request.get(new URL(image!).pathname);
      expect(logo.status()).toBe(200);
      expect(logo.headers()["content-type"]).toContain("image/webp");
      const icon = await page
        .locator('head link[rel="icon"]')
        .getAttribute("href");
      const favicon = await context.request.get(icon!);
      expect(favicon.status()).toBe(200);
      expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
      await expect(page.locator("#main noscript p")).toContainText(
        "Enable JavaScript",
      );
      await expect(page.getByRole("contentinfo")).toBeVisible();
    }
    await page.goto("/webmcp");
    await expect(
      page.getByRole("region", { name: "Requirements", exact: true }),
    ).toContainText("WebMCP-enabled browser");
    await expect(
      page.getByRole("region", { name: "Interactive demo", exact: true }),
    ).toContainText("Enable JavaScript");
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("link", { name: "Back to the catalog", exact: true })
      .click();
    await expect(
      page.locator(".lab-card-title a, .directory-card-title a"),
    ).toHaveCount(readManifest().routes.length - 1);
  } finally {
    await context.close();
  }
});

test("missing routes deliver a complete noindex 404 document without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    const response = await page.goto("/not-a-lab");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This lab does not exist.",
    );
    await expect(page).toHaveTitle(/This lab does not exist/);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, follow",
    );
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('head meta[property="og:url"]')).toHaveCount(0);
    await page
      .getByRole("link", { name: "Back to the catalog", exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Demos and UI workbench",
    );
  } finally {
    await context.close();
  }
});

test("the sitemap names exactly the public routes and robots points to it", async ({
  request,
  page,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("xml");
  const text = await response.text();
  const urls = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    if (document.querySelector("parsererror"))
      throw new Error("Invalid sitemap XML");
    return [...document.querySelectorAll("urlset > url > loc")]
      .map((node) => node.textContent)
      .sort();
  }, text);
  expect(urls).toEqual(
    readManifest()
      .routes.map((route) => `https://labs.markusnissl.com${route}`)
      .sort(),
  );
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(
    "Sitemap: https://labs.markusnissl.com/sitemap.xml",
  );
});

test("filtered URLs, history state and every route hydrate without replacing the shell", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const shell = document.querySelector(".site-shell");
      if (shell && !Reflect.get(window, "initialShell"))
        Reflect.set(window, "initialShell", shell);
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto("/?q=webmcp&tag=agents");
  await expect(page.locator(".lab-card-title a")).toHaveCount(1);
  await page.locator(".lab-card-title a").click();
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Back to the catalog", exact: true }),
  ).toHaveAttribute("href", "/?q=webmcp&tag=agents");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByTestId("reorder-point")).toHaveText("1,240 units");
  expect(
    await page.evaluate(
      () =>
        Reflect.get(window, "initialShell") ===
        document.querySelector(".site-shell"),
    ),
  ).toBe(true);
  for (const route of readManifest().routes) {
    await page.goto(route, { waitUntil: "networkidle" });
    expect(
      await page.evaluate(
        () =>
          Reflect.get(window, "initialShell") ===
          document.querySelector(".site-shell"),
      ),
      route,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("client navigation updates one set of metadata and removes canonical URLs on missing pages", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('a[href="/webmcp"]').first().click();
  await expect(page).toHaveTitle(
    "WebMCP: When a Page Declares Its Actions · Labs · Markus Nissl",
  );
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://labs.markusnissl.com/webmcp",
  );
  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    "content",
    await page.title(),
  );
  await page.goBack();
  await expect(page).toHaveTitle(
    "Demos and UI workbench · Labs · Markus Nissl",
  );
  await page.evaluate(() => {
    history.pushState(null, "", "/missing-client-route");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This lab does not exist.",
  );
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, follow",
  );
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('head meta[property="og:url"]')).toHaveCount(0);
  await page
    .getByRole("link", { name: "Back to the catalog", exact: true })
    .click();
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://labs.markusnissl.com/",
  );
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );
});
