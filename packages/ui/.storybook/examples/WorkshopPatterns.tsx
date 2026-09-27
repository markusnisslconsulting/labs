import type { ReactNode } from "react";
import { Accordion, type AccordionItem } from "../../src/components/Accordion";
import { Card } from "../../src/components/Card";
import { Cluster } from "../../src/components/Cluster";
import { Columns } from "../../src/components/Columns";
import { PageHeader } from "../../src/components/PageHeader";
import { Stack } from "../../src/components/Stack";

export function PageNavigation({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <Cluster renderAs={<nav aria-label={name} />} gap="lg">
      {children}
    </Cluster>
  );
}

export function LandingIntro({
  title,
  description,
  action,
  note,
}: {
  title: string;
  description: string;
  action: ReactNode;
  note: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      actions={action}
      meta={note}
    />
  );
}

export function TopicCards({ children }: { children: ReactNode }) {
  return <Columns min="sm">{children}</Columns>;
}

export function TopicCard({
  title,
  children,
  action,
}: {
  title: ReactNode;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <Card>
      <Card.Header>{title}</Card.Header>
      <Card.Body>{children}</Card.Body>
      <Card.Footer>{action}</Card.Footer>
    </Card>
  );
}

export function Questions({ items }: { items: AccordionItem[] }) {
  return <Accordion items={items} multiple={false} />;
}

export function PageFooter({ children }: { children: ReactNode }) {
  return (
    <Stack renderAs={<footer />} gap="sm">
      {children}
    </Stack>
  );
}
