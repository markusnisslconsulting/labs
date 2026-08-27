/**
 * The library, in a form a model can read.
 *
 * Stage 12 of the readiness roadmap, and the label describes something
 * concrete: an assistant writing UI in a codebase either uses the design
 * system or invents CSS. Which of the two happens depends on whether the
 * system is legible without reading 35 component files — a component's
 * props, the states it has, the sentence saying when to reach for
 * something else, and the rules it must not break.
 *
 * All of that already exists in this repository, in five places: the
 * TSDoc, the token registry, the keyboard map, the story tags and the
 * gates. None of it is readable as one thing. This generates that one
 * thing.
 *
 * Generated rather than written, for the same reason the token tables are:
 * a hand-written inventory is wrong the first time a prop is renamed, and
 * wrong silently. `nx run ui:inventory` fails when the committed file has
 * drifted, exactly like the DTCG export.
 *
 * What it deliberately does not do: infer. Every field below is copied
 * from something a person wrote — a prop signature, a doc sentence, a tag
 * — and a component missing one appears with that field absent rather
 * than with a plausible guess. An inventory that invents a prop is worse
 * than none, because the thing reading it cannot tell.
 *
 * Usage:
 *   tsx scripts/inventory.ts            # print
 *   tsx scripts/inventory.ts check
 *   tsx scripts/inventory.ts write
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { format } from "prettier";

const DIR = "packages/ui/src/components";
const OUT = "packages/ui/inventory.json";

interface Prop {
  name: string;
  type: string;
  required: boolean;
  /** The prop's own doc comment, first sentence, when it has one. */
  doc?: string;
}

interface Entry {
  component: string;
  /** stable | beta, from the story file's meta tags. */
  status?: string;
  /** The "**Use it for**" half of the docstring's first line. */
  useFor?: string;
  /** The "**Reach for something else when**" half. */
  insteadWhen?: string;
  /** What the component guarantees, and what the caller still owes. */
  accessibility?: string;
  props: Prop[];
  /**
   * The component takes no props of its own; it forwards an element's.
   *
   * Recorded rather than left as an empty array, because an empty array
   * reads the same whether a component has no props or the extractor
   * failed to find them. Card is the honest case: `CardProps =
   * ComponentPropsWithRef<"article">` and everything it offers is in its
   * three parts.
   */
  passthrough?: true;
  /** Compound parts: `Tabs.List`, `Card.Header`. */
  parts: string[];
  /** Component-tier tokens this component reads, with their defaults. */
  slots: Array<{ token: string; default: string }>;
}

/** Source with comments removed, for anything that must not read prose. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/**
 * A doc block collapsed to one line, with the comment gutter removed.
 *
 * The leading `*` of each line only. The first version stripped `*`
 * anywhere with /\s*\*\s?/g, which ate the `**` of `**Use it for**` —
 * the very marker the caller then searched for. Every component came back
 * undocumented and the report said so about the whole library.
 */
function sentence(text: string): string {
  return text
    .replace(/\/\*\*|\*\//g, "")
    .replace(/^[ \t]*\*[ \t]?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The component's main doc block.
 *
 * Not simply the first block carrying "**Use it for**". Chip has that
 * marker twice — once on its props type and once on the component — and
 * taking the first gave the type's block, which has no accessibility
 * line, so the check reported Chip as undocumented. The block that
 * documents the component is the one that also carries `Accessibility:`;
 * the last match is the fallback, because a component's own doc block
 * sits below its type declarations.
 */
function mainDoc(source: string): string {
  const blocks = (source.match(/\/\*\*[\s\S]*?\*\//g) ?? []).filter((block) =>
    block.includes("**Use it for**"),
  );
  return (
    blocks.find((block) => block.includes("Accessibility:")) ??
    blocks.at(-1) ??
    ""
  );
}

/**
 * Props from the component's own props interface.
 *
 * Only the `*OwnProps` interface, never the `Props` type that unions it
 * with an element's attributes. A model told that Button accepts 300
 * DOM attributes learns nothing; the component's own surface is the part
 * worth reading, and the docstring already says the rest land on the root.
 */
function props(source: string, component: string): Prop[] {
  /* Three shapes in this library, and the first version knew one.
     `interface XOwnProps { … }` is the common case; `interface XProps
     extends Omit<…> { … }` and a bare `interface XProps { … }` are the
     others. Six components used one of the latter two and came back with
     no props at all — an inventory that says a component takes nothing is
     worse than one that omits it, because the thing reading it cannot
     tell the difference. */
  const body =
    new RegExp(`interface ${component}OwnProps[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(
      source,
    )?.[1] ??
    new RegExp(`interface ${component}Props[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(
      source,
    )?.[1];
  if (!body) return [];
  const out: Prop[] = [];
  // Each entry is an optional doc block followed by `name?: type;`
  const entry = /(?:\/\*\*([\s\S]*?)\*\/\s*)?(\w+)(\?)?:\s*([^;]+);/g;
  let hit: RegExpExecArray | null;
  while ((hit = entry.exec(body))) {
    const [, doc, name, optional, type] = hit;
    const cleaned = sentence(doc ?? "");
    out.push({
      name: name!,
      type: type!.replace(/\s+/g, " ").trim(),
      required: !optional,
      ...(cleaned ? { doc: cleaned.split(/(?<=\.)\s/)[0] } : {}),
    });
  }
  return out;
}

/** Compound parts, from the `Component.Part = ` assignments. */
function parts(source: string, component: string): string[] {
  return [
    ...code(source).matchAll(new RegExp(`${component}\\.(\\w+)\\s*=`, "g")),
  ].map((hit) => `${component}.${hit[1]}`);
}

/** Override slots, from the Theming table the docs gate already requires. */
function slots(source: string): Array<{ token: string; default: string }> {
  return [
    ...source.matchAll(/\|\s*`(--uix-[\w-]+)`\s*\|\s*`([^`]+)`\s*\|/g),
  ].map((hit) => ({ token: hit[1]!, default: hit[2]! }));
}

/** The status tag a component's story meta carries. */
function status(component: string): string | undefined {
  let stories = "";
  try {
    stories = readFileSync(join(DIR, `${component}.stories.tsx`), "utf8");
  } catch {
    return undefined;
  }
  const tags = /tags:\s*\[([^\]]*)\]/.exec(stories)?.[1] ?? "";
  return ["stable", "beta", "experimental", "deprecated"].find((level) =>
    tags.includes(`"${level}"`),
  );
}

function build(): Entry[] {
  return readdirSync(DIR)
    .filter((file) => file.endsWith(".tsx") && !file.includes(".stories."))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort()
    .map((component) => {
      const source = readFileSync(join(DIR, `${component}.tsx`), "utf8");
      const doc = sentence(mainDoc(source));

      /* Sliced between markers rather than matched with a lazy group.
         The first version used /\*\*Use it for\*\*(.*?)(?:\*\*Reach for|$)/
         and every one of the 35 components came back empty: a lazy `.*?`
         with `$` in the alternation matches the empty string at the
         position right after the marker, so the check reported that the
         whole library had no documentation. The source was fine. The
         extraction was the bug — the same shape as a gate reading a
         docstring and reporting on the code. */
      const between = (start: string, ends: string[]) => {
        const from = doc.indexOf(start);
        if (from === -1) return undefined;
        const after = from + start.length;
        const stops = ends
          .map((end) => doc.indexOf(end, after))
          .filter((at) => at !== -1);
        const to = stops.length ? Math.min(...stops) : doc.length;
        const text = doc
          .slice(after, to)
          .trim()
          .replace(/[.\s]+$/, "");
        return text.length ? text : undefined;
      };

      const useFor = between("**Use it for**", [
        "**Reach for something else when**",
      ]);
      /* Stopped at its own sentence. Without the ". " the clause ran on
         into the paragraphs after it — Select's read as one 40-word
         sentence ending in "forms behave like the platform", which is a
         different claim than the one the marker introduces. */
      const insteadWhen = between("**Reach for something else when**", [
        ". ",
        "Accessibility:",
        "Performance:",
        "```",
      ]);
      const accessibility = between("Accessibility:", [
        "Performance:",
        "API note:",
        "```",
      ]);

      const entry: Entry = {
        component,
        props: props(source, component),
        parts: parts(source, component),
        slots: slots(source),
      };
      if (
        !entry.props.length &&
        !new RegExp(`interface ${component}(Own)?Props`).test(source)
      ) {
        entry.passthrough = true;
      }
      const level = status(component);
      if (level) entry.status = level;
      if (useFor) entry.useFor = useFor;
      if (insteadWhen) entry.insteadWhen = insteadWhen;
      if (accessibility) entry.accessibility = accessibility.slice(0, 400);
      return entry;
    });
}

const inventory = {
  note:
    "Generated from packages/ui/src by scripts/inventory.ts. Every field is " +
    "copied from something a person wrote — a prop signature, a doc " +
    "sentence, a story tag — and a component missing one appears with the " +
    "field absent rather than with a guess. Run `nx run ui:inventory-write` " +
    "after a deliberate change; `nx run ui:inventory` fails when this file " +
    "has drifted from the source.",
  components: build(),
};

/* Formatted by prettier rather than by JSON.stringify.
   The repository runs `prettier --check .` over everything, and prettier
   collapses short arrays onto one line while JSON.stringify does not — so
   the generator wrote one shape, prettier rewrote it, and the staleness
   check then failed against a file it had just produced. One formatter,
   not two. */
const serialised = await format(JSON.stringify(inventory), {
  parser: "json",
  filepath: OUT,
});
const mode = process.argv[2] ?? "print";

if (mode === "write") {
  writeFileSync(OUT, serialised);
  console.log(
    `inventory written: ${inventory.components.length} components, ` +
      `${inventory.components.reduce((sum, entry) => sum + entry.props.length, 0)} props`,
  );
  process.exit(0);
}

if (mode === "check") {
  let committed = "";
  try {
    committed = readFileSync(OUT, "utf8");
  } catch {
    console.error(
      `inventory missing. Run \`nx run ui:inventory-write\` and commit it.`,
    );
    process.exit(1);
  }
  if (committed !== serialised) {
    console.error(
      "inventory is stale.\n\n" +
        "  The committed file no longer matches the source. Run\n" +
        "  `nx run ui:inventory-write` and commit the result, so what an\n" +
        "  assistant reads is what the library does.",
    );
    process.exit(1);
  }
  const thin = inventory.components.filter(
    (entry) => !entry.useFor || !entry.accessibility,
  );
  if (thin.length) {
    console.error(
      `these components have no "use it for" or no accessibility line, so ` +
        `the inventory cannot say what they are: ` +
        `${thin.map((entry) => entry.component).join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `inventory current — ${inventory.components.length} components, ` +
      `${inventory.components.reduce((sum, entry) => sum + entry.props.length, 0)} props, ` +
      `${inventory.components.reduce((sum, entry) => sum + entry.parts.length, 0)} compound parts.`,
  );
  process.exit(0);
}

console.log(serialised);
