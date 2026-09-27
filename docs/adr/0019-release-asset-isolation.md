# Release asset isolation

Status: accepted

Hosting provides FTPS through the existing pipeline. A release cannot assume
SSH, symlinks or an atomic directory switch. Before changing the upload workflow,
the assembled artifact must let old and new documents load their own assets.

Store both builds under `releases/<source-sha>-<build-digest>/`. The digest covers
the copied build bytes, so distinct local builds at the same commit do not share
a directory. Stable site and Storybook entry documents refer to that directory.
The manifest remains outside the public root and records the release identifier,
source commit, dirty state and exact public file hashes.

The site uses relative Vite asset imports; assembly qualifies entry-document
asset references. Storybook's stable manager document uses explicit asset paths
and a release-specific preview URL. Its generated manager runtime also needs a
release-specific story-index URL: that URL is not exposed as a configuration
option by the installed version. Assembly replaces one verified generated
assignment and fails if its shape changes. Browser checks cover manager navigation,
keyboard skip links, preview rendering and the requested asset paths. Do not use
a document-wide base tag, which changes fragment-link behavior.

The published iframe URL forwards to the release-specific iframe while preserving
query and fragment. The immutable iframe keeps native relative links and imports.
Stable public schema and identity files remain available at their existing URLs.

This is an artifact contract, not a claim of atomic deployment. The FTPS workflow
must upload immutable directories before stable entry documents, retain previous
directories, and restore previous entry documents on rollback. Until that workflow
is implemented and rehearsed, remote retention and rollback remain outstanding.
