import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { localize } from "../catalog/localize";
import { SiteStringsProvider, useSiteStrings } from "./SiteStrings";

function Example() {
  const { locale, strings } = useSiteStrings();
  return createElement(
    "p",
    { lang: locale },
    [
      strings.backToCatalog,
      strings.count(1, 2),
      localize({ en: "Example", de: "Beispiel" }, locale),
      localize({ en: "Untranslated" }, locale),
      strings.requirements,
    ].join(" / "),
  );
}

it("uses application translations and manifest locale with English fallback", () => {
  expect(
    renderToStaticMarkup(
      createElement(SiteStringsProvider, {
        locale: "de",
        strings: {
          backToCatalog: "Zum Katalog",
          count: (shown, total) => `${shown} von ${total}`,
        },
        children: createElement(Example),
      }),
    ),
  ).toBe(
    '<p lang="de">Zum Katalog / 1 von 2 / Beispiel / Untranslated / Requirements</p>',
  );
});
