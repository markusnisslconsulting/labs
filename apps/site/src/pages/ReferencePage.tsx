import { useRef } from "react";
import { useSearchParams } from "react-router";
import { workbench } from "virtual:labs-workbench";
import { Button } from "@labs/ui/components/Button";
import { Columns } from "@labs/ui/components/Columns";
import { EmptyState } from "@labs/ui/components/EmptyState";
import { PageHeader } from "@labs/ui/components/PageHeader";
import { SearchInput } from "@labs/ui/components/SearchInput";
import { Select } from "@labs/ui/components/Select";
import { Stack } from "@labs/ui/components/Stack";
import { ReferenceCard } from "../components/ReferenceCard";
import { filterReferences } from "../catalog/workbench";
import { useHydrated } from "../hydration";
import { useSiteStrings } from "../i18n/SiteStrings";

export function ReferencePage({
  kind,
}: {
  kind: "components" | "foundations";
}) {
  const { strings } = useSiteStrings();
  const [params, setParams] = useSearchParams();
  const hydrated = useHydrated();
  const search = useRef<HTMLInputElement>(null);
  const query = hydrated ? (params.get("q") ?? "") : "";
  const requestedStatus =
    hydrated && kind === "components" ? (params.get("status") ?? "") : "";
  const status = Object.hasOwn(strings.componentStatus, requestedStatus)
    ? requestedStatus
    : "";
  const entries = workbench[kind];
  const visible = filterReferences(entries, query, status);
  const change = (name: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  };
  const clear = () => {
    const next = new URLSearchParams(window.location.search);
    next.delete("q");
    next.delete("status");
    setParams(next, { replace: true });
    search.current?.focus();
  };
  return (
    <Stack gap="xl" className="page">
      <PageHeader
        title={strings.directories[kind].title}
        description={strings.directories[kind].description}
      />
      <Columns
        min="md"
        gap="md"
        role="search"
        aria-label={strings.searchDirectory(strings.directories[kind].title)}
      >
        <SearchInput
          ref={search}
          name="reference-search"
          label={strings.searchDirectory(strings.directories[kind].title)}
          hideLabel={false}
          disabled={!hydrated}
          value={query}
          onChange={(event) => change("q", event.currentTarget.value)}
        />
        {kind === "components" ? (
          <Select
            name="reference-status"
            label={strings.statusFilter}
            disabled={!hydrated}
            value={status}
            onChange={(event) => change("status", event.currentTarget.value)}
            options={[
              { value: "", label: strings.allStatuses },
              ...Object.entries(strings.componentStatus).map(
                ([value, label]) => ({ value, label }),
              ),
            ]}
          />
        ) : null}
      </Columns>
      <p className="count-line" role="status">
        {strings.count(visible.length, entries.length)}
      </p>
      {visible.length ? (
        <Columns min="lg" renderAs={<ul />} className="lab-list plain-list">
          {visible.map((entry) => (
            <li key={entry.id}>
              <ReferenceCard entry={entry} />
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
