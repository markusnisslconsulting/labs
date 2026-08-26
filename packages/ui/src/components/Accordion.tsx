"use client";

import type { ComponentPropsWithRef } from "react";
import { Accordion as BaseAccordion } from "@base-ui-components/react/accordion";
import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { cxState } from "../cx";
import "./Accordion.css";
export interface AccordionItem {
  id: string;
  /** A node: a section heading often carries a count or a status. */
  title: ReactNode;
  body: ReactNode;
}

interface AccordionOwnProps {
  /**
   * The convenience form. A shorthand over the parts below and never the
   * only way in: a section whose heading needs a badge, or whose panel
   * needs its own layout, needs `Accordion.Item`.
   */
  items?: AccordionItem[];
  /** Allow several open sections at once. Default: one at a time. */
  multiple?: boolean;
  children?: ReactNode;
}

export type AccordionItemProps = ComponentPropsWithRef<
  typeof BaseAccordion.Item
>;
export type AccordionTriggerProps = ComponentPropsWithRef<
  typeof BaseAccordion.Trigger
>;
export type AccordionPanelProps = ComponentPropsWithRef<
  typeof BaseAccordion.Panel
>;

/**
 * Accepts every prop of Base UI's BaseAccordion.Root in addition to those below;
 * `className` merges with the component's own class and the rest land
 * on the root element.
 */
export type AccordionProps = AccordionOwnProps &
  Omit<
    ComponentPropsWithRef<typeof BaseAccordion.Root>,
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
 *
 * ```tsx
 * <Accordion>
 *   <Accordion.Item value="what">
 *     <Accordion.Trigger>
 *       What is pinned here <Badge>4</Badge>
 *     </Accordion.Trigger>
 *     <Accordion.Panel>…</Accordion.Panel>
 *   </Accordion.Item>
 * </Accordion>
 * ```
 */
export function Accordion({
  items,
  multiple = false,
  className,
  children,
  ...rest
}: AccordionProps) {
  return (
    <BaseAccordion.Root
      className={cxState("uix-accordion", className)}
      multiple={multiple}
      {...rest}
    >
      {children ??
        (items ?? []).map((item) => (
          <AccordionItemPart key={item.id} value={item.id}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionPanel>{item.body}</AccordionPanel>
          </AccordionItemPart>
        ))}
    </BaseAccordion.Root>
  );
}

function AccordionItemPart({ className, ...rest }: AccordionItemProps) {
  return (
    <BaseAccordion.Item
      className={cxState("uix-accordion-item", className)}
      {...rest}
    />
  );
}

/**
 * The trigger owns the header element and the open/closed marker, so a
 * caller composing sections cannot accidentally ship one without either.
 */
function AccordionTrigger({
  className,
  children,
  ...rest
}: AccordionTriggerProps) {
  return (
    <BaseAccordion.Header className="uix-accordion-heading">
      <BaseAccordion.Trigger
        className={cxState("uix-accordion-trigger", className)}
        {...rest}
      >
        {children}
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
  );
}

function AccordionPanel({ className, ...rest }: AccordionPanelProps) {
  return (
    <BaseAccordion.Panel
      className={cxState("uix-accordion-body", className)}
      {...rest}
    />
  );
}

Accordion.Item = AccordionItemPart;
Accordion.Trigger = AccordionTrigger;
Accordion.Panel = AccordionPanel;
