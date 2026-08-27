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

/**
 * Words that carry no evidence about which component someone wants.
 *
 * Not an optimisation. Without this list every word weighed the same, so
 * "warn the user that saving failed" was answered by whichever component's
 * documentation happened to contain "the", "that" and "user" — Stepper, as
 * it turned out, three stopwords to Alert's one real word. The right answer
 * appeared sometimes, and when it did it was for a reason that carried no
 * information.
 */
const STOPWORDS = new Set(
  (
    "a an and are as at be but by can for from has have how if in into is it " +
    "its let like make more much need of on once one only or over own same " +
    "several should so some such than that the their them then there these " +
    "they this those through to too under up use used user users using want " +
    "was way we were what when where which while who why will with without " +
    "you your someone something"
  ).split(" "),
);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * How well one query word matches a bag of words: 1 for the same word, 0.6
 * for a shared four-letter prefix, 0 otherwise.
 *
 * The prefix rule is a stemmer small enough to explain. People type "sorting"
 * and "steps" where the documentation says "sort" and "step", and a plain
 * substring test — the previous rule — matched "list" inside "checklist" and
 * "specialist" as readily as inside "listbox". Discounted rather than free,
 * because a prefix match is a guess.
 */
function overlap(word: string, bag: string[]): number {
  if (bag.includes(word)) return 1;
  if (word.length < 4) return 0;
  const stem = word.slice(0, 4);
  return bag.some((other) => other.length >= 4 && other.startsWith(stem))
    ? 0.6
    : 0;
}

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
    const queryWords = words(need);

    const scored = inventory
      .map((entry) => {
        const name = words(entry.component);
        const useFor = words(entry.useFor);
        const props = words(
          entry.props.map((prop) => `${prop.name} ${prop.doc}`).join(" "),
        );
        return {
          entry,
          /* Weighted by which sentence the word was found in. The component's
             own name and its "use it for" sentence say what it is; a prop doc
             mentioning the word is weaker evidence, and a component with
             thirty props would otherwise beat a component with four on volume
             alone.

             `insteadWhen` is not here on purpose. It is the sentence that
             says *reach for something else*, so a hit in it is evidence
             against this component and counting it as evidence for is
             backwards. Concretely: ProgressBar's sentence says to reach for
             Spinner, and while it was counted, searching "spinner" returned
             ProgressBar.

             Measured over twelve needs it never changed the first answer —
             a name match outweighs it — but it moved the second and third
             on half of them, and those are the suggestions a caller reads
             before deciding. The sentence is still printed with every
             result, because the pointer to the other component is the
             useful half of it. */
          score: queryWords.reduce(
            (total, word) =>
              total +
              3 * overlap(word, name) +
              2 * overlap(word, useFor) +
              0.75 * overlap(word, props),
            0,
          ),
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
