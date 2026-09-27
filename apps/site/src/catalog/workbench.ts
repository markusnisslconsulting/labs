export type WorkbenchReference = {
  name: string;
  description?: string;
  status?: "stable" | "beta" | "experimental" | "deprecated";
  kind: "component" | "foundation" | "guide";
  id: string;
  view: "docs" | "story";
  example?: string;
};
export type WorkbenchDirectory = {
  components: WorkbenchReference[];
  foundations: WorkbenchReference[];
};

export function storybookHref(
  reference: Pick<WorkbenchReference, "id" | "view">,
) {
  return `/storybook/index.html?path=/${reference.view}/${reference.id}`;
}

export function filterReferences(
  entries: WorkbenchReference[],
  query: string,
  status: string,
) {
  const needle = query.trim().toLocaleLowerCase("en");
  return entries.filter(
    (entry) =>
      (!status || entry.status === status) &&
      [entry.name, entry.description ?? ""]
        .join(" ")
        .toLocaleLowerCase("en")
        .includes(needle),
  );
}
