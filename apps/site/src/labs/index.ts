import { type ComponentType, lazy } from "react";

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

/**
 * One lazy component per lab, created once at module scope.
 *
 * Not in the render path: calling lazy() during render creates a new
 * component type on every pass, which remounts the demo and loses its
 * state. Built here, each lab's chunk — and the CSS of the design-system
 * components it uses — is fetched on first open and then cached.
 */
export const labDemos: Record<string, ComponentType> = Object.fromEntries(
  labs
    .filter((lab): lab is LabMeta & { demo: NonNullable<LabMeta["demo"]> } =>
      Boolean(lab.demo),
    )
    .map((lab) => [lab.slug, lazy(lab.demo)]),
);
