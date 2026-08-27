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

  it("answers the question a props table cannot", async () => {
    const text = said(
      await client.callTool({
        name: "find_component",
        arguments: {
          need: "let someone pick several suppliers from a long list",
        },
      }),
    );
    /* "Which one do I reach for" is answered by the `useFor` and
       `insteadWhen` sentences, and this is the assertion that the ranking
       actually uses them: Combobox is the answer, and it is the answer
       because its own sentence says "a list too long to scan" and "hold
       more than one answer". */
    expect(text.split("\n")[0]).toContain("Combobox");
    expect(text, "every suggestion carries its own way out").toContain(
      "instead when:",
    );
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
