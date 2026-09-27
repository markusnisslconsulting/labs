import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "../src/App";
import { catalog } from "../src/catalog";
import { metaTags, routeMetadata } from "../src/catalog/metadata";
import { english, SiteStringsProvider } from "../src/i18n/SiteStrings";

export function render(path: string) {
  const metadata = routeMetadata(path, catalog, english);
  const head = renderToStaticMarkup(
    <>
      <title>{metadata.title}</title>
      {metadata.canonical ? (
        <link rel="canonical" href={metadata.canonical} />
      ) : null}
      {metaTags(metadata).map(([attribute, name, value]) =>
        value === undefined ? null : (
          <meta key={name} {...{ [attribute]: name }} content={value} />
        ),
      )}
    </>,
  );
  const body = renderToString(
    <StaticRouter location={path}>
      <SiteStringsProvider>
        <App />
      </SiteStringsProvider>
    </StaticRouter>,
  );
  return { head, body };
}
