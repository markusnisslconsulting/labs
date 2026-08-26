"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Accordion as BaseAccordion } from "@base-ui-components/react/accordion";
import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { cxState } from "../cx";
import "./Accordion.css";
export interface AccordionItem {
  id: string;
  title: string;
  body: ReactNode;
}

interface AccordionOwnProps {
  items: AccordionItem[];
  /** Allow several open sections at once. Default: one at a time. */
  multiple?: boolean;
}

/**
 * Accepts every prop of Base UI's BaseAccordion.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type AccordionProps = AccordionOwnProps &
  Omit<
    ComponentPropsWithoutRef<typeof BaseAccordion.Root>,
    keyof AccordionOwnProps
  >;

/**
 * **Use it for** sections where only one answer matters at a time. **Reach for something else when** the sections are peer views to navigate between (Tabs).
 *
 * Disclosure sections on Base UI's accordion.
 *
 * Accessibility: Base UI renders header triggers with
 * `aria-expanded`/`aria-controls` and labelled regions, and handles
 * the keyboard (Enter/Space, Arrow navigation between triggers).
 *
 * Performance: closed panels are unmounted — toggling costs one
 * small mount, nothing else.
 */
export function Accordion({
  items,
  multiple = false,
  className,
  ...rest
}: AccordionProps) {
  return (
    <BaseAccordion.Root
      className={cxState("uix-accordion", className)}
      multiple={multiple}
      {...rest}
    >
      {items.map((item) => (
        <BaseAccordion.Item key={item.id} className="uix-accordion-item">
          <BaseAccordion.Header className="uix-accordion-heading">
            <BaseAccordion.Trigger className="uix-accordion-trigger">
              {item.title}
              <span aria-hidden className="uix-accordion-chevron">
                <span className="uix-accordion-chevron-open">
                  <Minus size={16} />
                </span>
                <span className="uix-accordion-chevron-closed">
                  <Plus size={16} />
                </span>
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
