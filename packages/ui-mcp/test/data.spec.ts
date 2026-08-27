/**
 * The server may not know anything the repository does not already check.
 *
 * That is the design constraint, and it is what makes this server different
 * from documentation: every answer comes from a file with a gate behind it —
 * `ui:inventory`, `ui:api-surface`, `ui:tokens-dtcg`, and the keyboard map's
 * own coverage test. So the risk is not that the data is wrong; it is that
 * the *reading* of it is, and silently.
 *
 * Two of the four sources are parsed rather than imported, which is where
 * that risk lives. `keyboard.map.ts` is read with a regex, because importing
 * it would mean this server needs a TypeScript build to answer a question
 * about a data table — and a regex over a file whose shape changes returns
 * fewer rows rather than an error. These tests are the thing that notices.
 */
import { describe, expect, it } from "vitest";

import { KEYBOARD_MAP } from "../../ui/src/keyboard.map.ts";
import { allTokens } from "../../ui/src/tokens.registry.ts";
import {
  loadApiSurface,
  loadInventory,
  loadKeyboard,
  loadTokens,
} from "../src/data.ts";

const root = process.cwd();

describe("the data the MCP server answers from", () => {
  it("parses every row of the keyboard map, not most of them", () => {
    const parsed = loadKeyboard(root);
    /* Counted against the imported source, which is the only comparison
       that means anything: a regex that silently matched thirty rows out of
       forty-two would leave the server confidently short, and every
       component whose keys fell out would simply appear to have none. */
    expect(parsed).toHaveLength(KEYBOARD_MAP.length);

    const parsedKeys = new Set(
      parsed.map((row) => `${row.component} ${row.key}`),
    );
    const missing = KEYBOARD_MAP.map(
      (row) => `${row.component} ${row.key}`,
    ).filter((key) => !parsedKeys.has(key));
    expect(missing, "these rows were not parsed out of the source").toEqual([]);
  });

  it("reads each row's expectation whole, including the wrapped ones", () => {
    const parsed = loadKeyboard(root);
    for (const row of KEYBOARD_MAP) {
      const found = parsed.find(
        (one) => one.component === row.component && one.key === row.key,
      )!;
      /* Several expectations are written as a concatenation across lines
         because they do not fit in eighty columns. Taking the first quoted
         piece would give half a sentence, which reads as a complete one. */
      expect(
        found.expectation,
        `${row.component} ${row.key} was read as a fragment`,
      ).toBe(row.expectation);
    }
  });

  it("every component has the sentences the server promises to answer with", () => {
    const inventory = loadInventory(root);
    expect(inventory.length).toBeGreaterThan(40);

    const thin = inventory.filter(
      (entry) => !entry.useFor || !entry.insteadWhen || !entry.accessibility,
    );
    /* `find_component` ranks on `useFor` and `insteadWhen`, and
       `describe_component` prints the accessibility line. A component
       missing one of them is a component this server answers about with a
       blank where the useful part goes. */
    expect(
      thin.map((entry) => entry.component),
      "these components would be answered about with an empty sentence",
    ).toEqual([]);
  });

  it("the keyboard map only names components that exist", () => {
    const names = new Set(loadInventory(root).map((one) => one.component));
    const unknown = [
      ...new Set(KEYBOARD_MAP.map((row) => row.component)),
    ].filter((component) => !names.has(component));
    expect(
      unknown,
      "the map documents keys for something the inventory does not list",
    ).toEqual([]);
  });

  it("reads every token, with the name a stylesheet would type", () => {
    const parsed = loadTokens(root);

    /* Counted against the import, and both earlier versions of this parser
       needed it. The first derived names from the DTCG export, whose top
       level is the tier, and produced `--uix-semantic-accent` for a property
       called `--uix-accent` — every semantic and component token came out
       with a name that does not exist. The second stopped inside
       `--uix-font-sans`, whose value contains an escaped quote, and returned
       151 of 154. Both answered rather than failed. */
    expect(parsed).toHaveLength(allTokens.length);

    const names = new Set(parsed.map((token) => token.name));
    const missing = allTokens
      .map((token) => token.name)
      .filter((name) => !names.has(name));
    expect(missing, "these tokens were not parsed out of the registry").toEqual(
      [],
    );

    /* And the values and tiers match, not just the names — a parser that
       read the right count with its fields shifted by one would satisfy
       everything above. */
    for (const token of allTokens) {
      const found = parsed.find((one) => one.name === token.name)!;
      expect(found.value, `${token.name} has the wrong value`).toBe(
        token.value,
      );
      expect(found.level, `${token.name} has the wrong tier`).toBe(token.level);
    }
  });

  it("the api surface resource is the real file", () => {
    const surface = loadApiSurface(root);
    expect(surface).toContain("# Public API surface");
    expect(surface).toContain("## DataTable");
  });
});
