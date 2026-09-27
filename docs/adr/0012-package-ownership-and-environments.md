# Package ownership and runtime environments

Status: accepted · 2026-09-22

Applications declare their own runtime dependencies. Root dependencies are development tools used across the workspace. Tests, stories and build configuration may use those tools; runtime code must use its owner's declared dependencies or peers.

Workspace imports resolve through package exports. TypeScript and Vite no longer map arbitrary package subpaths into source directories. Nx enforces project layers, and the repository ESLint rule checks declarations, public exports, Node imports, cross-lab access and sibling-checkout imports. Only configuration files may import build plugins.

The base TypeScript configuration contains ECMAScript libraries without ambient platform types. Browser and Node projects extend separate configurations. Neutral domain packages check their source against the base and their tests against the Node configuration. `agent-stream` receives a scheduler from its caller; `undo-machine` copies its known receipt structure without platform APIs.

Configuration and browser test files have explicit typecheck coverage. Browser test configurations include browser and Node libraries because their callbacks execute in both environments. This does not change the runtime project's environment.

The UI consumer probe installs the built package in a temporary directory outside the checkout, using the installed dependency versions and an offline install. Both barrel and subpath consumers bundle through the artifact's exports. Missing artifacts or dependencies fail the check. No source aliases or root runtime dependencies are supplied to the consumer.
