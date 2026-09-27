# FTPS release promotion

Status: accepted

Deploy the archive produced by successful main-branch CI. Do not rebuild it in
the deployment job. Automatic deployment also requires that its source commit
is still main's head. Manual rollback selects a successful CI run and attempt;
the source SHA and artifact identity come from GitHub's run metadata. Both paths
verify the downloaded manifest, file hashes and publication checks before FTPS.

Use the existing FTP server, username, password and public destination. Require
explicit TLS with certificate verification on control and data connections. A
separate, serialized deployment workflow must not cancel an in-progress transfer.
No step removes the public directory or an older release directory.

Upload new immutable files first. Existing immutable files must have matching
bytes; a mismatch is an error. Upload through a temporary filename, verify its
bytes, then rename it. Probe replacement support in private storage before
touching stable entries. If the server cannot replace a file by rename, stop.
This is a per-file operation, not an atomic site-wide switch.

Before promotion, retain the prior entry bytes and expected replacements in a
private transaction journal beside the public directory. Recheck the prior bytes
before replacing entries to detect an intervening writer. Publish routing rules
last. On failed browser smoke checks, reconnect and restore prior entries. An
unfinished journal is recovered before another release starts; unexpected third
party edits stop recovery instead of being overwritten. GitHub concurrency owns
serialization; do not run a second deployment client outside that workflow.

Smoke checks cover catalog routes, component Docs and a story, the public schema,
missing assets, artifact bytes and a local demo action. The smoke process does
not receive FTPS credentials. Failed restoration leaves the journal for recovery.
Forced termination cannot guarantee immediate rollback; the next run recovers it.

Keep remote release directories and private journals until an explicit storage
maintenance operation. CI archives have a 30-day retention window for manual
artifact-based rollback. Upload failure or exhausted quota must leave existing
entry files intact. A storage cleanup policy requires host quota information and
is not part of automatic deployment.

Local fault injection and an isolated FTPS server verify the client contract.
They do not prove production permissions or server rename behavior. Those are
checked by the deployment preflight when publishing is separately authorized.
