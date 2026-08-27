/**
 * The design system, as something a model can ask questions of.
 *
 * Stage 12 of `docs/roadmap.md` is "readable by an agent", and its first half
 * was `packages/ui/inventory.json`: forty-nine components with their props,
 * their compound parts, and the sentences saying when to reach for something
 * else, generated from source with a gate that fails when it drifts. This is
 * the second half — the same data, answerable by question rather than by
 * reading a file.
 *
 * Why it is worth having: an agent writing against this library has two
 * questions, and neither is answered by a props table. "Which component do I
 * reach for" is answered by the `insteadWhen` sentences, which exist
 * precisely to send somebody elsewhere. "What does it promise" is answered by
 * the accessibility line and the keyboard map. Both are already written down
 * and already gated; nothing here is a second source.
 *
 * Every answer comes from a file some gate keeps honest — `ui:inventory`,
 * `ui:api-surface`, `ui:tokens-dtcg`, and the keyboard map's own coverage
 * test. That is the design constraint: this server may not know anything the
 * repository does not already check.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { z } from "zod";

import {
  loadApiSurface,
  loadInventory,
  loadKeyboard,
  loadTokens,
  workspaceRoot,
  type InventoryComponent,
} from "./data.ts";

const root = workspaceRoot(dirname(fileURLToPath(import.meta.url)));

const inventory = loadInventory(root);
const keyboard = loadKeyboard(root);
const tokens = loadTokens(root);

const byName = new Map(
  inventory.map((entry) => [entry.component.toLowerCase(), entry]),
);

/** One component, as the paragraph somebody would want to read. */
function describe(entry: InventoryComponent): string {
  const rows = keyboard.filter((row) => row.component === entry.component);
  const lines = [
    `# ${entry.component} (${entry.status})`,
    "",
    `Use it for: ${entry.useFor}`,
    `Reach for something else when: ${entry.insteadWhen}`,
    "",
    `Accessibility: ${entry.accessibility}`,
  ];

  if (entry.parts.length) {
    lines.push("", `Compound parts: ${entry.parts.join(", ")}`);
  }
  if (entry.slots.length) {
    lines.push(`Override slots: ${entry.slots.join(", ")}`);
  }

  lines.push("", "## Props", "");
  for (const prop of entry.props) {
    lines.push(
      `- \`${prop.name}${prop.required ? "" : "?"}: ${prop.type}\`` +
        (prop.doc ? ` — ${prop.doc}` : ""),
    );
  }

  if (rows.length) {
    lines.push("", "## Keyboard", "");
    for (const row of rows) {
      lines.push(`- \`${row.key}\` ${row.expectation} (${row.owner})`);
    }
  }

  return lines.join("\n");
}

const server = new McpServer({ name: "labs-ui", version: "1.0.0" });

server.registerTool(
  "list_components",
  {
    title: "List every component",
    description:
      "Every component in @labs/ui with its status and the one line saying " +
      "what it is for. Start here when you do not know what exists.",
    inputSchema: {},
  },
  async () => ({
    content: [
      {
        type: "text",
        text: inventory
          .map(
            (entry) => `${entry.component} (${entry.status}) — ${entry.useFor}`,
          )
          .join("\n"),
      },
    ],
  }),
);

server.registerTool(
  "describe_component",
  {
    title: "Describe one component",
    description:
      "Every prop with its type and documentation, the compound parts, the " +
      "override slots, the accessibility promise and the keyboard contract.",
    inputSchema: { name: z.string().describe("The component's name") },
  },
  async ({ name }) => {
    const entry = byName.get(name.toLowerCase());
    if (!entry) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text:
              `No component called "${name}". ` +
              `The names are: ${inventory.map((one) => one.component).join(", ")}`,
          },
        ],
      };
    }
    return { content: [{ type: "text", text: describe(entry) }] };
  },
);

server.registerTool(
  "find_component",
  {
    title: "Find the component for a job",
    description:
      "Search what each component is for, when to reach for something else, " +
      "and its prop names. This is the question a props table cannot " +
      "answer: which one do I use, and which one should I not.",
    inputSchema: {
      need: z
        .string()
        .describe("What you are trying to build, in your own words"),
    },
  },
  async ({ need }) => {
    const words = need
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2);

    const scored = inventory
      .map((entry) => {
        const haystack = [
          entry.component,
          entry.useFor,
          entry.insteadWhen,
          ...entry.props.map((prop) => `${prop.name} ${prop.doc}`),
        ]
          .join(" ")
          .toLowerCase();
        return {
          entry,
          score: words.filter((word) => haystack.includes(word)).length,
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (!scored.length) {
      return {
        content: [
          {
            type: "text",
            text:
              `Nothing matched "${need}". Try list_components — and if the ` +
              `thing genuinely does not exist, docs/roadmap.md stage 03 says ` +
              `what was deliberately left out and why.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: scored
            .map(
              ({ entry }) =>
                `${entry.component} — ${entry.useFor}\n` +
                `  instead when: ${entry.insteadWhen}`,
            )
            .join("\n\n"),
        },
      ],
    };
  },
);

server.registerTool(
  "list_tokens",
  {
    title: "List the design tokens",
    description:
      "Every design token with its value, tier and what it is for. " +
      "Components bind to semantic and component tokens, never to primitive " +
      "values — see docs/adr/0002, which is why the tier is in every answer.",
    inputSchema: {
      contains: z
        .string()
        .optional()
        .describe("Only tokens whose name contains this"),
      level: z
        .enum(["primitive", "semantic", "component"])
        .optional()
        .describe("Only this tier"),
    },
  },
  async ({ contains, level }) => {
    const matches = tokens.filter(
      (token) =>
        (!contains || token.name.includes(contains)) &&
        (!level || token.level === level),
    );
    return {
      content: [
        {
          type: "text",
          text:
            matches.length === 0
              ? `No token matches.`
              : matches
                  .map(
                    (token) =>
                      `${token.name}: ${token.value}  [${token.level}]` +
                      (token.description ? ` — ${token.description}` : ""),
                  )
                  .join("\n"),
        },
      ],
    };
  },
);

server.registerResource(
  "api-surface",
  "labs-ui://api-surface",
  {
    title: "The public API surface",
    description:
      "Every exported signature with the prose stripped, generated from the " +
      "emitted declarations. What a consumer's compiler sees.",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: loadApiSurface(root),
      },
    ],
  }),
);

await server.connect(new StdioServerTransport());
