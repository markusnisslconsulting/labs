import { Accordion as BaseAccordion } from "@base-ui-components/react/accordion";
import type { ReactNode } from "react";

export interface AccordionItem {
  id: string;
  title: string;
  body: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow several open sections at once. Default: one at a time. */
  multiple?: boolean;
}

/**
 * Disclosure sections on Base UI's accordion.
 *
 * Accessibility: Base UI renders header triggers with
 * `aria-expanded`/`aria-controls` and labelled regions, and handles
 * the keyboard (Enter/Space, Arrow navigation between triggers).
 *
 * Performance: closed panels are unmounted — toggling costs one
 * small mount, nothing else.
 */
export function Accordion({ items, multiple = false }: AccordionProps) {
  return (
    <BaseAccordion.Root className="uix-accordion" multiple={multiple}>
      {items.map((item) => (
        <BaseAccordion.Item key={item.id} className="uix-accordion-item">
          <BaseAccordion.Header className="uix-accordion-heading">
            <BaseAccordion.Trigger className="uix-accordion-trigger">
              {item.title}
              <span aria-hidden className="uix-accordion-chevron">
                <span className="uix-accordion-chevron-open">−</span>
                <span className="uix-accordion-chevron-closed">+</span>
              </span>
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel className="uix-accordion-body">
            {item.body}
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}
