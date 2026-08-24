import { Tabs as BaseTabs } from "@base-ui-components/react/tabs";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultActive?: number;
  /** Accessible name for the tablist, e.g. "Sample details". */
  label: string;
}

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
export function Tabs({ tabs, defaultActive = 0, label }: TabsProps) {
  return (
    <BaseTabs.Root className="uix-tabs" defaultValue={tabs[defaultActive]?.id}>
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
