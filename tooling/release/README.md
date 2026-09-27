# Release assembly and preview

`release-tools:assemble` depends on the site and Storybook builds. It copies
public files into a temporary directory, generates Apache
routing rules, records SHA-256 hashes, verifies the result, then replaces the
local `dist/release` artifact. Validation failures preserve the previous artifact.
The version 2 manifest records the source commit, release identifier and whether
the checkout had local changes. Site and Storybook files live under
`releases/<source-sha>-<build-digest>/`; stable entry documents select that release.
This includes Storybook's non-hashed manager files and story index. Entry generation
keeps fragment navigation unchanged and checks the generated Storybook assignment
before qualifying its index URL. See [ADR 0019](../../docs/adr/0019-release-asset-isolation.md).

The assembler excludes root build metadata (`project.json`, `preview-stats.json`
and the site's route-generation input), rejects symlinks and non-regular files,
and restricts public paths through `artifact-policy.ts`. Assembly and verification
scan readable content for credentials, workstation paths, source maps and copied
assistant context. Matches report rule identifiers without their values.
Storybook's deliberate component examples and source snippets are public content.
The build import guard, reviewed output paths and scanner limits are described in
[ADR 0017](../../docs/adr/0017-public-artifact-boundary.md).

The site build supplies a distinct HTML document for each catalog route and the
404 page, plus canonical/social metadata, a sitemap and robots file. Its private
server renderer never enters the release. Assembly qualifies document asset URLs
into the release namespace. See [ADR 0022](../../docs/adr/0022-prerendered-route-documents.md).

The preview and generated Apache rules select each route's prerendered document,
mount Storybook at `/storybook/`, and serve existing assets
without SPA fallback. Unknown document routes return the 404 document with HTTP
404; missing assets and Storybook paths return error responses. Trailing slashes
on catalog routes redirect to their canonical path. Dotfiles cannot be fetched.
The published `/storybook/iframe.html` forwards to its release-specific document
with the original query and fragment. The preview also checks file hashes before
listening and supports GET and HEAD.

The Apache policy uses [local error documents](https://httpd.apache.org/docs/2.4/custom-error.html)
and [mod_rewrite rules](https://httpd.apache.org/docs/2.4/rewrite/flags.html).
It was exercised with Apache 2.4.67 locally. This verifies the generated rules,
not the production host's permitted directives or deployment capabilities.
To run the same browser suite against another local server, set `RELEASE_URL`
when invoking `playwright test --config tests/release/playwright.config.ts`.

The two-release browser rehearsal overlays immutable files before replacing
entry documents, checks open site/manager tabs, then restores the previous entries.
It verifies local file retention and entry restoration; it does not exercise FTPS.
The FTPS transaction and its failure handling are described below. Running the
local preview or gates never publishes a release.

## CI artifact

After full gates pass on main, CI verifies the assembled manifest against the
clean checkout's SHA, archives `manifest.json` and `public/` together, and retains
that archive for 30 days. It does not rebuild between browser checks and upload.
The archive preserves `.htaccess`; the manifest stays outside the public root.
The artifact name includes the commit and workflow attempt.

`pnpm release:verify <sha>` repeats the integrity and clean-checkout checks locally.
The deployment workflow consumes this archive after successful main CI, without
rebuilding. It checks the run, attempt, repository, source SHA and artifact ID;
automatic runs skip an older result when main has advanced. Downloaded archives
must pass the manifest/content checks again. Extraction rejects links, duplicate
or escaping paths and unexpected files. Limits are 64 MiB per file, 512 MiB in
total and 20,000 entries.

## FTPS deployment and recovery

The workflow uses the existing `FTP_SERVER`, `FTP_USERNAME` and `FTP_PASSWORD`
secrets on port 21, with verified TLS for control and data transfers. The public
destination remains `labs.markusnissl.com/public/`. Private transaction journals
live beside it in `labs.markusnissl.com/.labs-deploy/`, outside the public root.
The workflow serializes deployment and does not cancel an active promotion.

Each upload uses a temporary file, byte verification and rename. A private
preflight checks replacement support and confirms that a fresh session can discover
private backup paths and hidden files. Existing immutable files must match the artifact. Assets are uploaded first, then the
previous entry bytes are backed up and the pending journal is written. Entry
documents follow; `.htaccess` is last. There is no site-wide atomic switch.

Browser smoke checks verify stable entries and schemas against the artifact,
catalog routes, component Docs/story rendering, asset hashes/content types,
missing responses and a local demo action. FTPS credentials and the GitHub token
are removed from the smoke process environment. A failed promotion reconnects
and restores prior entry bytes, skipping entries that are already unchanged. After
successful HTTP checks, the client reconnects and rechecks the entry bytes before
clearing the journal. New immutable files and all older assets remain.

To roll back, open **Deploy to Hetzner → Run workflow** on main and select a
successful main CI run ID and attempt that still has its version 2 release
archive. This publishes that verified artifact through the same transaction and
smoke checks. No checkout rebuild is used. Archives are retained for 30 days;
older pre-migration runs without an archive cannot be selected this way.

If a job is forcibly stopped or restoration loses its connection, the private
pending journal remains. The next selected deployment recovers it before starting
another transaction. Unexpected entry bytes from another writer stop recovery;
do not delete the journal or overwrite those bytes without inspecting the change.
The retained `transactions/<id>.json` contains previous entry bytes as base64 and
their SHA-256 hashes, including the initial legacy deployment. It is private
recovery material, not a public artifact. Entry backups are limited to 16 MiB.

Remote releases and journals are not automatically pruned. Storage maintenance
must preserve active and rollback releases; host quota and retention requirements
must be established before adding deletion. An upload/quota failure before
promotion leaves current entry files untouched. Forced termination during
promotion can leave a mixture until the next recovery run.

Local tests inject transfer, rename, acknowledgement and smoke failures. A separate
isolated pyftpdlib FTPS rehearsal checked certificate rejection, rename failure
recovery and a browser-verified deployment. Production permissions and replacement
behavior remain subject to preflight when publishing is authorized. See
[ADR 0020](../../docs/adr/0020-ftps-release-promotion.md).
