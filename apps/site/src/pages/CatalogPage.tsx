import { useRef } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Button } from "@labs/ui/components/Button";
import { Chip } from "@labs/ui/components/Chip";
import { Cluster } from "@labs/ui/components/Cluster";
import { Columns } from "@labs/ui/components/Columns";
import { EmptyState } from "@labs/ui/components/EmptyState";
import { PageHeader } from "@labs/ui/components/PageHeader";
import { SearchInput } from "@labs/ui/components/SearchInput";
import { Select } from "@labs/ui/components/Select";
import { Stack } from "@labs/ui/components/Stack";
import { catalog } from "../catalog";
import {
  executionModes,
  filterCatalog,
  readFilters,
  updateFilter,
} from "../catalog/filters";
import { LabCard } from "../components/LabCard";
import { useSiteStrings } from "../i18n/SiteStrings";
import { useHydrated } from "../hydration";
import { DirectoryCards } from "../components/DirectoryCards";

export function CatalogPage({
  directory,
}: {
  directory?: "demos" | "patterns";
}) {
  const { strings, locale } = useSiteStrings();
  const searchRef = useRef<HTMLInputElement>(null);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const hydrated = useHydrated();
  const filters = readFilters(hydrated ? params : new URLSearchParams());
  const entries = directory
    ? catalog.filter(
        (entry) => entry.kind === (directory === "demos" ? "demo" : "pattern"),
      )
    : catalog;
  const allTags = [...new Set(entries.flatMap((entry) => entry.tags))].sort();
  const visible = filterCatalog(entries, filters, locale);
  // History changes before React finishes a route transition. Read that URL
  // when composing edits so a second control cannot overwrite the first one.
  const currentParams = () => new URLSearchParams(window.location.search);
  const change = (key: "q" | "tag" | "execution", value: string) =>
    setParams(updateFilter(currentParams(), key, value), { replace: true });
  const clear = () => {
    const next = currentParams();
    for (const key of ["q", "tag", "execution"]) next.delete(key);
    setParams(next, { replace: true });
    searchRef.current?.focus();
  };
  return (
    <Stack gap="xl" className="page">
      <PageHeader
        title={
          directory
            ? strings.directories[directory].title
            : strings.catalogTitle
        }
        description={
          directory
            ? strings.directories[directory].description
            : strings.catalogDescription
        }
      />
      {!directory ? <DirectoryCards /> : null}
      <Stack gap="md" role="search" aria-label={strings.search}>
        <Columns min="md" gap="md">
          <SearchInput
            ref={searchRef}
            name="catalog-search"
            placeholder={strings.search}
            label={strings.search}
            hideLabel={false}
            disabled={!hydrated}
            value={filters.query}
            onChange={(event) => change("q", event.currentTarget.value)}
          />
          <Select
            name="catalog-execution"
            label={strings.filterExecution}
            disabled={!hydrated}
            value={filters.execution}
            onChange={(event) => change("execution", event.currentTarget.value)}
            options={[
              { value: "", label: strings.allExecutions },
              ...executionModes.map((value) => ({
                value,
                label: strings.execution[value],
              })),
            ]}
          />
        </Columns>
        <Cluster gap="xs" role="group" aria-label={strings.filterTags}>
          <Chip
            interactive
            disabled={!hydrated}
            active={!filters.tag}
            onActiveChange={() => change("tag", "")}
          >
            {strings.allTags}
          </Chip>
          {allTags.map((tag) => (
            <Chip
              key={tag}
              interactive
              disabled={!hydrated}
              active={filters.tag === tag}
              onActiveChange={() =>
                change(
                  "tag",
                  readFilters(currentParams()).tag === tag ? "" : tag,
                )
              }
            >
              {tag}
            </Chip>
          ))}
        </Cluster>
      </Stack>
      <p className="count-line" role="status">
        {strings.count(visible.length, entries.length)}
      </p>
      {visible.length ? (
        <Columns min="lg" renderAs={<ul />} className="lab-list plain-list">
          {visible.map((entry) => (
            <li key={entry.slug}>
              <LabCard
                entry={entry}
                returnTo={location.pathname + (hydrated ? location.search : "")}
              />
            </li>
          ))}
        </Columns>
      ) : (
        <EmptyState
          title={strings.noMatches}
          description={strings.noMatchesDescription}
          action={
            <Button variant="outline" onClick={clear}>
              {strings.clearFilters}
            </Button>
          }
        />
      )}
    </Stack>
  );
}
