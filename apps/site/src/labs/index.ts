import type { LabMeta } from "./types";

/**
 * Every folder under labs/ that exports a lab.tsx is a lab. The glob
 * runs at build time, so a new lab registers itself by existing — the
 * hundredth lab costs exactly what the first one did.
 */
const modules = import.meta.glob<{ default: LabMeta }>("./*/lab.tsx", {
  eager: true,
});

export const labs: LabMeta[] = Object.values(modules).map(
  (module) => module.default,
);

export const allTags: string[] = [
  ...new Set(labs.flatMap((lab) => lab.tags)),
].sort();

export function labBySlug(slug: string | undefined): LabMeta | undefined {
  return labs.find((lab) => lab.slug === slug);
}
