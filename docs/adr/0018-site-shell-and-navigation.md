# Site shell, catalog navigation and strings

Status: accepted

## Decision

`apps/site/src/App.tsx` owns route wiring. `shell/` owns site identity,
landmarks and navigation behavior; `pages/` composes the catalog, detail and
missing-page views. Demo state stays in its feature. The shell and pages use
shared Container, PageHeader, Card and layout components.

The catalog stores `q`, `tag` and `execution` in the URL. Filter edits replace
that history entry, so typing does not create a Back stop for every character.
Edits compose against the current browser URL: history updates synchronously,
while React may still be rendering the preceding navigation. Unrelated query
parameters are preserved. Unknown execution values behave as the unfiltered
choice; unknown tags produce an empty result that can be cleared.

Internal card links use the router and carry their catalog return URL in
history state. Only a same-origin catalog path is accepted as a return link.
A new route focuses its heading and starts at the top. Browser Back restores
the saved scroll and focused card when that history entry exists in the mounted
application. Query edits keep input focus. Refresh preserves filters through
the URL; saved focus/scroll positions are in memory, capped at 100 entries.

Application labels and message formatters belong to `i18n/SiteStrings.tsx`.
The provider selects the locale used for manifest content and accepts label
and formatter overrides with an English fallback. English is the only shipped
application locale. Component-library and feature-specific strings retain
their existing providers; adding a locale must configure those too.

Execution badges describe declared scenarios, not detected browser support.
The workbench's full-size link is at the top of its page. Its optional embedded
manager is mounted only after an explicit action, and removed when closed.

## Verification

Browser tests cover consecutive filter edits, refresh, detail/return links,
Back/Forward, keyboard navigation, scroll restoration, skip navigation and
optional Storybook loading. Route accessibility and horizontal containment are
checked at 320, 390, 768 and 1280 pixels in both themes, including the missing
page. These checks cover initial route states; feature interaction tests cover
the exercised demo states separately.
