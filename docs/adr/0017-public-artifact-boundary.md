# 0017 — Public artifact boundary

Status: accepted

## Context

The site and Storybook intentionally publish component examples, source snippets
and fictional demo data. Workspace instructions, audit notes, test fixtures and
credentials are private inputs. Checking file extensions alone cannot distinguish
those cases or detect a private document compiled into JavaScript.

## Decision

The UI, site and Storybook preview builds use `publicModules` from `@labs/tools`.
It rejects workspace instruction/environment files, audit and task documents,
test reports, test/fixture inputs, private-key files and source maps. Files outside
the workspace are rejected unless they belong to an installed dependency. Vite's
canonical paths are compared against a canonical workspace root so symlinked
checkout and temporary-directory paths cannot bypass the boundary.

Stories, public MDX guides, `examples/` data and the demo protocol schemas remain
valid inputs. Installed dependencies are not classified as private workspace
fixtures; their emitted content still goes through release checks. Storybook's
Node configuration may import build tooling; its browser preview may not.

`tooling/release/artifact-policy.ts` defines the allowed output paths:

- The site and Storybook entry documents, generated server policy and public
  identity assets.
- The demo's public `catalogs/ticket-ui.json` schema and Storybook's story index.
- Hashed web assets in each surface's asset directory.
- The configured Storybook manager/addon bundles, fonts and mocker entry point.

Unexpected files fail assembly instead of being silently added to the release.
Adding a static resource or changing the generated output layout requires reviewing
its path in this policy. Preserve license files if a dependency update emits them;
add their reviewed public paths rather than deleting notices to pass the check.

Assembly and verification scan every public file's readable bytes. The scanner
checks literal and decoded JavaScript/HTML escapes for workstation/runner paths,
source-map directives and copied assistant-context markup. Credential detection
uses the pinned [Secretlint recommended rules](https://github.com/secretlint/secretlint),
without the comment-suppression rule. Findings report only a relative file path
and rule identifiers; matched content is not printed. A rejected staged release
leaves the previous assembled artifact intact.

`build` and `build-storybook` include dependency production inputs in their Nx
cache keys. UI's explicit build inputs also include the shared build/check
scripts. Changes to a source-only build tool therefore invalidate consuming
builds, even when that tool has no build target of its own.

## Verification

Real Vite builds exercise denied raw/URL imports and allowed public examples.
Temporary Nx workspaces verify warm-cache reuse and invalidation after a
source-only dependency changes. Release fixtures check path restrictions, escaped
paths, inline/external map references, recognizable credentials, attempted scanner
suppression, binary-readable content and redacted diagnostics. Assembly and final
verification both reject forbidden content, including content with matching
manifest hashes.

## Limits

These checks detect accidental private inputs and recognizable literal content.
They do not establish that arbitrary prose is suitable for publication, identify
every possible credential format, or decode encrypted/opaque media content.
Review still owns fictional data, screenshots, licensing and wording. Deliberate
AI protocol documentation and public source examples are not banned by vocabulary.
Remote promotion must consume the verified artifact; these checks do not change
the host's deployment policy.
