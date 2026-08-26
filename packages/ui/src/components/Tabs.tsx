"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";

import { cxState } from "../cx";
import "./Tabs.css";

export interface TabItem {
  id: string;
  /**
   * The tab's visible content. A node, not a string: a tab label is very
   * often a word and a count, or a word and a status dot, and while this
   * was `string` the only way to get either was to stop using Tabs.
   */
  label: ReactNode;
  content: ReactNode;
  /**
   * Renders the tab present but not selectable. It keeps its place in
   * the list, because a tab that disappears when unavailable moves
   * every tab after it.
   */
  disabled?: boolean;
}

interface TabsOwnProps {
  /**
   * The convenience form. Given a list, Tabs builds the parts itself.
   *
   * It is a shorthand over the compound API below and never the only way
   * in — that distinction is the whole point. A list-shaped prop can only
   * describe the arrangement its author imagined; `children` can describe
   * the one you need.
   */
  tabs?: TabItem[];
  /**
   * Which tab starts selected, as an index into `tabs`. Only meaningful
   * with the shorthand; when composing, use `defaultValue`.
   *
   * Named `…Index` because it is one: as `defaultActiveIndex` it read like the
   * uncontrolled half of an `active` triple, which it is not — there is
   * no `active` state on Tabs, the value is a tab id.
   *
   * The value triple — `value`, `defaultValue`, `onValueChange` — comes
   * from Base UI's root and reaches this component through `rest`. It is
   * named here so it is part of the documented API rather than something
   * a reader has to know to look for.
   */
  defaultActiveIndex?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the tablist, e.g. "Sample details". */
  label?: string;
  children?: ReactNode;
}

/**
 * Accepts every prop of Base UI's BaseTabs.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type TabsProps = TabsOwnProps &
  Omit<ComponentPropsWithoutRef<typeof BaseTabs.Root>, keyof TabsOwnProps>;

export type TabListProps = ComponentPropsWithoutRef<typeof BaseTabs.List>;
export type TabProps = ComponentPropsWithoutRef<typeof BaseTabs.Tab>;
export type TabPanelProps = ComponentPropsWithoutRef<typeof BaseTabs.Panel>;

/**
 * **Use it for** peer sections of content in one context. **Reach for something else when** the sections are filters over one list (SegmentedControl).
 *
 * WAI-ARIA tabs on Base UI, composable.
 *
 * API: two ways in, and the second one is the real one. Pass `tabs` for
 * the common case, or compose `Tabs.List`, `Tabs.Tab` and `Tabs.Panel`
 * when a tab needs a badge, a panel needs its own layout, or the list
 * needs something beside it. Every part takes the attributes of the
 * element it renders, so `id`, `data-*`, `ref` and a merging `className`
 * all work on the parts and not only on the root.
 *
 * Accessibility: Base UI renders the tablist/tab/tabpanel wiring —
 * `aria-selected`, `aria-controls`/`aria-labelledby`, roving
 * tabindex — and handles Arrow/Home/End per the ARIA pattern. Name the
 * list with `label` in the shorthand form, or with `aria-label` on
 * `Tabs.List` when composing.
 *
 * Performance: inactive panels stay out of the DOM flow (hidden), one
 * value state drives the whole set.
 *
 * ```tsx
 * <Tabs defaultValue="open">
 *   <Tabs.List aria-label="Orders">
 *     <Tabs.Tab value="open">
 *       Open <Badge tone="warning">12</Badge>
 *     </Tabs.Tab>
 *     <Tabs.Tab value="done">Done</Tabs.Tab>
 *   </Tabs.List>
 *   <Tabs.Panel value="open">…</Tabs.Panel>
 *   <Tabs.Panel value="done">…</Tabs.Panel>
 * </Tabs>
 * ```
 */
export function Tabs({
  tabs,
  defaultActiveIndex = 0,
  label,
  className,
  children,
  ...rest
}: TabsProps) {
  const composed = children !== undefined;

  return (
    <BaseTabs.Root
      className={cxState("uix-tabs", className)}
      {...(composed || !tabs
        ? {}
        : { defaultValue: tabs[defaultActiveIndex]?.id ?? undefined })}
      {...rest}
    >
      {composed ? (
        children
      ) : (
        <>
          <TabList aria-label={label}>
            {(tabs ?? []).map((tab) => (
              <Tab key={tab.id} value={tab.id} disabled={tab.disabled}>
                {tab.label}
              </Tab>
            ))}
          </TabList>
          {(tabs ?? []).map((tab) => (
            <TabPanel key={tab.id} value={tab.id}>
              {tab.content}
            </TabPanel>
          ))}
        </>
      )}
    </BaseTabs.Root>
  );
}

/* Every part merges rather than replaces, and cxState rather than cx
   because a Base UI className may be a function of that part's state —
   so a caller can still derive classes from data-selected and keep ours. */

function TabList({ className, ...rest }: TabListProps) {
  return (
    <BaseTabs.List className={cxState("uix-tablist", className)} {...rest} />
  );
}

function Tab({ className, ...rest }: TabProps) {
  return <BaseTabs.Tab className={cxState("uix-tab", className)} {...rest} />;
}

function TabPanel({ className, ...rest }: TabPanelProps) {
  return (
    <BaseTabs.Panel className={cxState("uix-tabpanel", className)} {...rest} />
  );
}

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
