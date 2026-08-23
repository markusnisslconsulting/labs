import { useState } from "react";

export interface AccordionItem {
  id: string;
  title: string;
  body: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow several open sections at once. Default: one at a time. */
  multiple?: boolean;
}

/**
 * Disclosure sections.
 *
 * Accessibility: headers are real buttons with `aria-expanded` +
 * `aria-controls`; the bodies are labelled regions, so screen reader
 * users hear which section a region belongs to.
 *
 * Performance: toggling flips the `hidden` attribute — the closed
 * panels render nothing and cost nothing.
 */
export function Accordion({ items, multiple = false }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set([items[0]?.id].filter(Boolean) as string[]),
  );

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const isOpen = current.has(id);
      if (multiple) {
        const next = new Set(current);
        if (isOpen) next.delete(id);
        else next.add(id);
        return next;
      }
      return isOpen ? new Set() : new Set([id]);
    });
  };

  return (
    <div className="uix-accordion">
      {items.map((item) => {
        const open = openIds.has(item.id);
        return (
          <section key={item.id} className="uix-accordion-item">
            <h3 className="uix-accordion-heading">
              <button
                type="button"
                className="uix-accordion-trigger"
                aria-expanded={open}
                aria-controls={`${item.id}-body`}
                id={`${item.id}-trigger`}
                onClick={() => toggle(item.id)}
              >
                {item.title}
                <span aria-hidden className="uix-accordion-chevron">
                  {open ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              role="region"
              id={`${item.id}-body`}
              aria-labelledby={`${item.id}-trigger`}
              hidden={!open}
              className="uix-accordion-body"
            >
              {item.body}
            </div>
          </section>
        );
      })}
    </div>
  );
}
