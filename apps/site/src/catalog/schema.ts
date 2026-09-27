import { z } from "zod";
import { directories } from "./directories";

const text = z.string().trim().min(1);
const identifier = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const localizedText = z.object({ en: text }).catchall(text);
const localizedParagraphs = z
  .object({ en: z.array(text).min(1) })
  .catchall(z.array(text).min(1));
const httpsUrl = z
  .url()
  .refine(
    (url) => new URL(url).protocol === "https:",
    "Resource links must use HTTPS",
  );
const resource = z.strictObject({
  kind: z.enum(["article", "source", "reference"]),
  title: localizedText,
  href: httpsUrl,
});
const requirement = z.strictObject({
  id: identifier,
  title: localizedText,
  detail: localizedText,
});
const scenario = z.strictObject({
  id: identifier,
  title: localizedText,
  description: localizedText,
  execution: z.enum(["scripted", "browser", "native", "integration"]),
  requirements: z.array(identifier),
});
export const catalogEntrySchema = z
  .strictObject({
    slug: identifier,
    kind: z.enum(["demo", "component", "pattern", "foundation"]),
    title: localizedText,
    summary: localizedText,
    explanation: localizedParagraphs,
    tags: z.array(identifier).min(1),
    resources: z.array(resource),
    requirements: z.array(requirement),
    scenarios: z.array(scenario),
    relatedComponents: z.array(text),
    renderer: z.discriminatedUnion("type", [
      z.strictObject({
        type: z.literal("demo"),
        entry: z.string().regex(/^(labs|patterns)\/[a-z0-9-]+\/LabDemo\.tsx$/),
      }),
      z.strictObject({
        type: z.literal("storybook"),
        id: z.string().regex(/^[a-z0-9-]+--[a-z0-9-]+$/),
        view: z.enum(["story", "docs"]),
      }),
    ]),
  })
  .superRefine((entry, ctx) => {
    for (const [label, values] of [
      ["tags", entry.tags],
      ["requirements", entry.requirements.map((item) => item.id)],
      ["scenarios", entry.scenarios.map((item) => item.id)],
      ["resources", entry.resources.map((item) => item.href)],
      ["relatedComponents", entry.relatedComponents],
    ] as const) {
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: "custom",
          path: [label],
          message: `Duplicate ${label}`,
        });
    }
    if (
      entry.kind === "demo" &&
      (entry.renderer.type !== "demo" || entry.scenarios.length === 0)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Demos require an executable renderer and at least one scenario",
      });
    for (const item of entry.scenarios)
      for (const id of item.requirements)
        if (!entry.requirements.some((requirement) => requirement.id === id))
          ctx.addIssue({
            code: "custom",
            message: `Scenario ${item.id} refers to missing requirement ${id}`,
          });
  });

export const catalogSchema = z
  .array(catalogEntrySchema)
  .superRefine((entries, ctx) => {
    const slugs = new Set<string>();
    const reserved = new Set([
      ...directories,
      "storybook",
      "assets",
      "releases",
      "404",
      "index",
      "favicon",
      "robots",
      "sitemap",
    ]);
    for (const [index, entry] of entries.entries()) {
      if (slugs.has(entry.slug) || reserved.has(entry.slug))
        ctx.addIssue({
          code: "custom",
          path: [index, "slug"],
          message: `Duplicate or reserved slug: ${entry.slug}`,
        });
      slugs.add(entry.slug);
    }
  });
export type CatalogEntry = z.infer<typeof catalogEntrySchema>;
export type CatalogKind = CatalogEntry["kind"];
export type ExecutionMode = CatalogEntry["scenarios"][number]["execution"];

export function validateReferences(
  entries: CatalogEntry[],
  available: {
    components: Set<string>;
    demos: Set<string>;
    stories?: Map<string, "story" | "docs">;
  },
) {
  const errors: string[] = [];
  for (const entry of entries) {
    for (const component of entry.relatedComponents)
      if (!available.components.has(component))
        errors.push(`${entry.slug}: unknown component ${component}`);
    if (
      entry.renderer.type === "demo" &&
      !available.demos.has(entry.renderer.entry)
    )
      errors.push(`${entry.slug}: missing demo ${entry.renderer.entry}`);
    if (
      entry.renderer.type === "storybook" &&
      available.stories &&
      available.stories.get(entry.renderer.id) !== entry.renderer.view
    )
      errors.push(
        `${entry.slug}: missing ${entry.renderer.view} ${entry.renderer.id}`,
      );
  }
  if (errors.length) throw new Error(errors.join("\n"));
}
