import type { ReactNode } from "react";
import { Accordion, type AccordionProps } from "@labs/ui/components/Accordion";
import { Section } from "@labs/ui/components/Section";

export type FaqItem = { id: string; question: ReactNode; answer: ReactNode };

export function Faq({
  id,
  title,
  description,
  items,
  value,
  defaultValue,
  onValueChange,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  items: FaqItem[];
} & Pick<AccordionProps, "value" | "defaultValue" | "onValueChange">) {
  return (
    <Section id={id} title={title} description={description}>
      <Accordion
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        multiple={false}
      >
        {items.map((item) => (
          <Accordion.Item key={item.id} value={item.id}>
            <Accordion.Trigger>{item.question}</Accordion.Trigger>
            <Accordion.Panel>{item.answer}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Section>
  );
}
