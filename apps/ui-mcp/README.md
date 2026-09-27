# UI catalog server

Read-only MCP tools for the component inventory, keyboard contracts, tokens and API surface. The server reads an explicitly selected Labs checkout. It is a local development application, not a standalone distributable catalog.

## Run

From the workspace root, after installing dependencies:

```sh
pnpm nx run ui-mcp:serve
```

For an editor's MCP configuration, use Node with absolute paths:

```sh
node --experimental-strip-types /path/to/labs/apps/ui-mcp/src/server.ts \
  --workspace /path/to/labs
```

The process uses stdio and does not open a network port. Missing workspace files or invalid inventory data stop startup with an error on stderr. The caller's working directory may be outside the checkout.

## Tools and resource

- `list_components`: component names, status and intended uses.
- `describe_component`: props, compound parts, override token/default pairs, accessibility notes and keyboard behavior.
- `find_component`: search intended uses and alternatives.
- `list_tokens`: filter token names or tiers.
- `labs-ui://api-surface`: exported signatures.

## Data

| Content              | Source                               | Validation                                        |
| -------------------- | ------------------------------------ | ------------------------------------------------- |
| Components and props | `packages/ui/inventory.json`         | Shared schema; `ui:inventory` checks source drift |
| Keyboard behavior    | `packages/ui/src/keyboard.map.ts`    | Parser parity tests and UI keyboard coverage      |
| Tokens               | `packages/ui/src/tokens.registry.ts` | Parser parity tests and token gates               |
| API surface          | `packages/ui/api-surface.md`         | `ui:api-surface`                                  |

The keyboard and token readers depend on the source tables' formatting. Tests compare parsed values against the public exports. Running the server does not run the repository gates; validate the selected checkout before relying on its metadata.
