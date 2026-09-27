import { AppShell } from "../components/AppShell";
import { Container } from "../components/Container";
import { PageHeader } from "../components/PageHeader";
import { Section } from "../components/Section";
import { Stack } from "../components/Stack";
import "./SupplierPage.css";

/** Fictional page composition shared by the shell examples. */
export function SupplierPage({ detail = false }: { detail?: boolean }) {
  return (
    <AppShell
      header={
        <Container className="example-supplier-chrome">
          Nordwind Operations
        </Container>
      }
      nav={
        <Stack gap="sm" className="example-supplier-nav" renderAs={<ul />}>
          <li>
            <a href="#delivery-windows">Delivery windows</a>
          </li>
          <li>
            <a href="#contacts">Contacts</a>
          </li>
        </Stack>
      }
      navLabel="Supplier sections"
      navWidth={detail ? "sm" : "md"}
      footer={
        <Container className="example-supplier-chrome">
          Fictional supplier workspace
        </Container>
      }
    >
      <Container>
        <Stack gap="xl" className="example-supplier-content">
          <PageHeader
            title={detail ? "Nordwind Textiles" : "Suppliers"}
            description={
              detail
                ? "Contract NW-4417, renewed in March."
                : "Every supplier with an active contract."
            }
          />
          <Section id="delivery-windows" title="Delivery windows">
            <p>Weekly, Tuesday and Friday.</p>
          </Section>
          <Section id="contacts" title="Contacts">
            <p>Two named contacts coordinate each delivery.</p>
          </Section>
        </Stack>
      </Container>
    </AppShell>
  );
}
