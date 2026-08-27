/**
 * The server, over the protocol, as a client would meet it.
 *
 * `data.spec.ts` checks what the server knows. This checks that it can be
 * spoken to — and the two are genuinely different: the first version of this
 * server passed every data test and could not start, because `./data.js` is
 * not a file when Node is stripping types off `./data.ts`. A unit test never
 * imports the entry point, so nothing noticed.
 *
 * One thing to know when reading a failure here: a server that cannot start
 * fails `beforeAll`, and vitest reports the tests below it as **skipped**
 * rather than failed — "6 passed | 7 skipped" is what a completely broken
 * server looks like in the summary. The exit code is 1 either way, so CI is
 * right; it is the human reading the output who is misled.
 *
 * Driven with the SDK's own client over stdio, which is the transport a
 * configured editor uses. Slower than a unit test by about a second, and the
 * second buys the only assertion that covers the wiring: the tools are
 * registered, they answer, and an unknown name comes back as an error rather
 * than as a confident guess.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadInventory } from "../src/data.ts";

interface TextContent {
  type: string;
  text: string;
}

let client: Client;

/** The first text block of a tool result, which is all these tools return. */
const said = (result: unknown) =>
  (result as { content: TextContent[] }).content[0]?.text ?? "";

beforeAll(async () => {
  client = new Client({ name: "labs-ui-test", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ["--experimental-strip-types", "packages/ui-mcp/src/server.ts"],
      cwd: process.cwd(),
    }),
  );
}, 30_000);

afterAll(async () => {
  await client?.close();
});

describe("the MCP server over stdio", () => {
  it("starts and registers what it advertises", async () => {
    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      "describe_component",
      "find_component",
      "list_components",
      "list_tokens",
    ]);

    const resources = await client.listResources();
    expect(resources.resources.map((one) => one.uri)).toContain(
      "labs-ui://api-surface",
    );
  });

  it("lists every component the inventory holds", async () => {
    const text = said(
      await client.callTool({ name: "list_components", arguments: {} }),
    );
    /* One line per component, counted against the inventory rather than a
       number typed here: a server that answered about forty of forty-nine
       would look complete. */
    expect(text.split("\n")).toHaveLength(loadInventory(process.cwd()).length);
  });

  it("describes a component with its props and its keyboard", async () => {
    const text = said(
      await client.callTool({
        name: "describe_component",
        arguments: { name: "datatable" },
      }),
    );
    expect(text).toContain("# DataTable");
    expect(text, "the name is matched case-insensitively").toContain(
      "Use it for:",
    );
    expect(text).toContain("Reach for something else when:");
    expect(text).toContain("## Props");
    expect(text, "`rowKey` is required and has to say so").toContain(
      "`rowKey: (row: Row) => string`",
    );
    expect(
      text,
      "the keyboard contract is the other half of what an agent needs",
    ).toContain("## Keyboard");
  });

  it("says it does not know rather than guessing", async () => {
    const result = (await client.callTool({
      name: "describe_component",
      arguments: { name: "Nonesuch" },
    })) as { isError?: boolean; content: TextContent[] };

    expect(result.isError, "an unknown component came back as a success").toBe(
      true,
    );
    /* And the error is useful: it names what does exist, because the next
       thing a caller does is guess again. */
    expect(said(result)).toContain("DataTable");
  });

  /**
   * Twelve needs, phrased the way someone would ask, each with the component
   * that is the right answer.
   *
   * This used to be one query, and the number it produced was 1 of 1. Run
   * over a batch the ranker gets 10 of 12 into the top three and 7 of 12
   * exactly first, which is the honest description of a word-overlap search
   * over fifty short sentences. The single query was one of the seven.
   *
   * Top three rather than first, because that is what the tool can promise:
   * it returns eight suggestions with their "instead when" sentences and the
   * caller reads them. Several of these needs also have a defensible second
   * answer — "show progress through a multi step checkout" is a fair
   * description of ProgressBar — and a test demanding one true first result
   * would be asserting a preference, not a contract.
   */
  const NEEDS: Array<[need: string, answer: string]> = [
    ["let someone pick several suppliers from a long list", "Combobox"],
    ["show tabular data the user can sort by column", "DataTable"],
    ["let someone upload a contract file", "FileUpload"],
    ["pick a delivery date", "DatePicker"],
    ["show progress through a multi step checkout", "Stepper"],
    ["a long piece of free text like a note", "Textarea"],
    ["show a hierarchy of folders that can expand", "Tree"],
    ["edit a title in place without a dialog", "InlineEdit"],
    ["a panel that slides in from the side", "Drawer"],
    ["one main action with more options next to it", "SplitButton"],
  ];

  /**
   * The two needs the ranker does not answer, kept here rather than deleted.
   *
   * Neither is a ranking fault, and that is why they are written down. A
   * word-overlap search can only find words that are there:
   *
   *   "warn the user that saving failed" misses Alert, whose sentence is
   *   "feedback about what the user just did". It says nothing about warning
   *   or failing. The old scorer did rank Alert second, by matching "the",
   *   "user" and "that" — the right answer for no reason.
   *
   *   "let the user type several keywords as chips" returns Chip, which is
   *   arguably what was asked for, ahead of TagInput, which is what was
   *   meant.
   *
   * The fix for both is vocabulary in the documentation, not arithmetic in
   * the search, so it belongs to whoever next edits those sentences.
   */
  const KNOWN_GAPS: Array<[need: string, answer: string]> = [
    ["warn the user that saving failed", "Alert"],
    ["let the user type several keywords as chips", "TagInput"],
  ];

  it("answers the question a props table cannot", async () => {
    const missed: string[] = [];
    for (const [need, answer] of NEEDS) {
      const text = said(
        await client.callTool({ name: "find_component", arguments: { need } }),
      );
      const suggested = text
        .split("\n")
        .filter((line) => !line.startsWith(" "))
        .map((line) => line.split(" — ")[0]);
      if (!suggested.slice(0, 3).includes(answer)) {
        missed.push(`"${need}" -> ${suggested.slice(0, 3).join(", ")}`);
      }
      expect(text, "every suggestion carries its own way out").toContain(
        "instead when:",
      );
    }
    expect(missed, "these needs stopped finding their component").toEqual([]);
  });

  it("still does not answer the two gaps, and says so out loud", async () => {
    /* Asserted so the list above cannot quietly become a list of needs
       nobody checks: if someone fixes Alert's sentence, this fails and the
       need moves up into NEEDS. A known gap that is silently fixed is a
       comment claiming a limitation that no longer exists. */
    const stillMissing: string[] = [];
    for (const [need, answer] of KNOWN_GAPS) {
      const text = said(
        await client.callTool({ name: "find_component", arguments: { need } }),
      );
      const suggested = text
        .split("\n")
        .filter((line) => !line.startsWith(" "))
        .map((line) => line.split(" — ")[0]);
      if (!suggested.slice(0, 3).includes(answer)) stillMissing.push(need);
    }
    expect(
      stillMissing.length,
      "a documented gap now works; move it into NEEDS and delete the note",
    ).toBe(KNOWN_GAPS.length);
  });

  /**
   * A component must not be suggested because it pointed somewhere else.
   *
   * Each row is a word, and the components whose only connection to it is a
   * sentence recommending against themselves: ProgressBar's "reach for
   * something else when" names Spinner, so while `insteadWhen` was scored as
   * evidence, searching "spinner" returned ProgressBar. Twenty-one words in
   * the inventory have this shape; these four are the check.
   *
   * A property rather than a query. The version of this file before it
   * asserted one need and one expected answer, which said nothing about the
   * other forty-nine components and happened to be one of the queries that
   * worked.
   */
  const POINTS_AWAY: Array<[word: string, mustNotAppear: string[]]> = [
    ["spinner", ["ProgressBar", "Skeleton"]],
    ["menu", ["CommandPalette"]],
    ["form", ["InlineEdit"]],
    ["numberfield", ["Field"]],
  ];

  it("does not suggest a component for pointing elsewhere", async () => {
    const wrong: string[] = [];
    for (const [word, mustNotAppear] of POINTS_AWAY) {
      const text = said(
        await client.callTool({
          name: "find_component",
          arguments: { need: word },
        }),
      );
      const suggested = text
        .split("\n")
        .filter((line) => !line.startsWith(" "))
        .map((line) => line.split(" — ")[0]);
      for (const name of mustNotAppear) {
        if (suggested.includes(name)) {
          wrong.push(`"${word}" suggested ${name}, which recommends against`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("filters tokens by tier, because the tier is the rule", async () => {
    const semantic = said(
      await client.callTool({
        name: "list_tokens",
        arguments: { contains: "accent", level: "semantic" },
      }),
    );
    expect(semantic).toContain("--uix-accent");
    expect(semantic).toContain("[semantic]");
    expect(
      semantic,
      "a primitive leaked into a semantic-only answer, and ADR 0002 is the " +
        "rule it would break",
    ).not.toContain("[primitive]");
  });

  it("serves the api surface as a resource", async () => {
    const result = await client.readResource({
      uri: "labs-ui://api-surface",
    });
    /* A resource content is text or a blob, and the type is the union of
       both. Narrowing on the property rather than casting: a cast would
       compile against a blob answer too, which is the case this asserts is
       not happening. */
    const first = result.contents[0];
    expect(first && "text" in first, "the resource came back as a blob").toBe(
      true,
    );
    const text = (first as { text: string }).text;
    expect(text).toContain("# Public API surface");
    expect(text.length).toBeGreaterThan(10_000);
  });
});
