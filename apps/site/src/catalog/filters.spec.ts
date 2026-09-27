import { describe, expect, it } from "vitest";
import { loadCatalog } from "../../scripts/catalog";
import {
  catalogReturn,
  entryExecutions,
  filterCatalog,
  readFilters,
  updateFilter,
} from "./filters";

const { entries } = loadCatalog();
describe("catalog filters", () => {
  it("finds an entry by its public slug even when its title differs", () => {
    expect(
      filterCatalog(
        entries,
        { query: "CHAT-BOX", tag: "", execution: "" },
        "en",
      ).map((entry) => entry.slug),
    ).toEqual(["chat-box"]);
  });
  it("combines search, tag and execution and searches translated text", () => {
    const params = new URLSearchParams("q=WEBMCP&tag=agents&execution=native");
    expect(
      filterCatalog(entries, readFilters(params), "en").map(
        (entry) => entry.slug,
      ),
    ).toEqual(["webmcp"]);
    params.set("execution", "scripted");
    expect(filterCatalog(entries, readFilters(params), "en")).toEqual([]);
    const translated = {
      ...entries[0]!,
      title: { en: "Example", de: "Übersetzung" },
    };
    expect(
      filterCatalog(
        [translated],
        { query: "ÜBER", tag: "", execution: "" },
        "de",
      ),
    ).toEqual([translated]);
  });
  it("keeps requirements distinct from demonstrated native availability", () => {
    expect(
      entryExecutions(entries.find((entry) => entry.slug === "on-device-ai")!),
    ).toEqual(["native"]);
    expect(
      entryExecutions(entries.find((entry) => entry.slug === "webmcp")!),
    ).toEqual(["browser", "native"]);
    expect(
      entryExecutions(entries.find((entry) => entry.slug === "workbench")!),
    ).toEqual(["storybook"]);
  });
  it("preserves unrelated parameters and encodes text without mutating current history", () => {
    const params = new URLSearchParams("tag=agents&context=article");
    const next = updateFilter(params, "q", "AI & browser");
    expect(next.get("q")).toBe("AI & browser");
    expect(next.get("context")).toBe("article");
    expect(params.has("q")).toBe(false);
    expect(updateFilter(next, "tag", "").has("tag")).toBe(false);
    expect(
      readFilters(new URLSearchParams("execution=unknown")).execution,
    ).toBe("");
  });
  it("only accepts catalog return destinations from history state", () => {
    expect(catalogReturn("/?q=AI&execution=native")).toBe(
      "/?q=AI&execution=native",
    );
    for (const directory of ["demos", "components", "patterns", "foundations"])
      expect(catalogReturn(`/${directory}?q=example`)).toBe(
        `/${directory}?q=example`,
      );
    for (const value of [
      "https://other.invalid/",
      "//other.invalid/",
      "/webmcp",
      "javascript:alert(1)",
      {},
      null,
    ])
      expect(catalogReturn(value)).toBe("/");
  });
});
