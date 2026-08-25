import type { ComponentPropsWithoutRef } from "react";
import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";

import { cxState } from "../cx";
import "./Tabs.css";
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsOwnProps {
  tabs: TabItem[];
  defaultActive?: number;
  /** Accessible name for the tablist, e.g. "Sample details". */
  label: string;
}

/**
 * Accepts every prop of Base UI's BaseTabs.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type TabsProps = TabsOwnProps &
  Omit<ComponentPropsWithoutRef<typeof BaseTabs.Root>, keyof TabsOwnProps>;

/**
 * WAI-ARIA tabs on Base UI.
 *
 * Accessibility: Base UI renders the tablist/tab/tabpanel wiring —
 * `aria-selected`, `aria-controls`/`aria-labelledby`, roving
 * tabindex — and handles Arrow/Home/End per the ARIA pattern.
 *
 * Performance: inactive panels stay out of the DOM flow (hidden), one
 * value state drives the whole set.
 */
export function Tabs({
  tabs,
  defaultActive = 0,
  label,
  className,
  ...rest
}: TabsProps) {
  return (
    <BaseTabs.Root
      className={cxState("uix-tabs", className)}
      defaultValue={tabs[defaultActive]?.id}
      {...rest}
    >
      <BaseTabs.List className="uix-tablist" aria-label={label}>
        {tabs.map((tab) => (
          <BaseTabs.Tab key={tab.id} className="uix-tab" value={tab.id}>
            {tab.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {tabs.map((tab) => (
        <BaseTabs.Panel key={tab.id} className="uix-tabpanel" value={tab.id}>
          {tab.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
