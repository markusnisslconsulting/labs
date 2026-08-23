import { useRef, useState, type KeyboardEvent } from "react";

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
 * WAI-ARIA tabs with roving tabindex.
 *
 * Accessibility: `role=tablist/tab/tabpanel`, `aria-selected`,
 * `aria-controls`/`aria-labelledby` pairs. Arrow keys and Home/End
 * move selection per the ARIA pattern; inactive tabs leave the tab
 * order (roving tabindex).
 *
 * Performance: one keydown handler on the list handles all keys
 * (delegation); panels are plain conditional renders — hidden tabs
 * cost nothing.
 */
export function Tabs({ tabs, defaultActive = 0, label }: TabsProps) {
  const [active, setActive] = useState(defaultActive);
  const listRef = useRef<HTMLDivElement>(null);

  const move = (next: number) => {
    const clamped = (next + tabs.length) % tabs.length;
    setActive(clamped);
    const tabButton =
      listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[
        clamped
      ];
    tabButton?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        move(active + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        move(active - 1);
        break;
      case "Home":
        event.preventDefault();
        move(0);
        break;
      case "End":
        event.preventDefault();
        move(tabs.length - 1);
        break;
    }
  };

  return (
    <div className="uix-tabs">
      <div
        className="uix-tablist"
        role="tablist"
        aria-label={label}
        ref={listRef}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`${tab.id}-tab`}
            aria-selected={index === active}
            aria-controls={`${tab.id}-panel`}
            tabIndex={index === active ? 0 : -1}
            className="uix-tab"
            onClick={() => setActive(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${tab.id}-panel`}
          aria-labelledby={`${tab.id}-tab`}
          hidden={index !== active}
          className="uix-tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
