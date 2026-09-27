import { Button } from "../../src/components/Button";
import { Container } from "../../src/components/Container";
import { Panel } from "../../src/components/Panel";
import { Section } from "../../src/components/Section";
import { Stack } from "../../src/components/Stack";
import { ContactForm } from "./ContactForm";
import {
  LandingIntro,
  PageFooter,
  PageNavigation,
  Questions,
  TopicCard,
  TopicCards,
} from "./WorkshopPatterns";
import "./Workshop.css";

export const workshopQuestions = [
  {
    id: "prepare",
    title: "What should I prepare?",
    body: "Choose one screen, form or message. Use fictional content so everyone can work with the same example.",
  },
  {
    id: "experience",
    title: "Do I need design experience?",
    body: "No. Bring a task you understand and describe what someone needs to achieve. The exercises start there.",
  },
  {
    id: "booking",
    title: "Can I book this workshop?",
    body: "This is a fictional workshop. The form demonstrates validation and local state; it does not create a booking.",
  },
];

export function WorkshopTopics() {
  return (
    <TopicCards>
      <TopicCard
        title={<h3>Make a request clearer</h3>}
        action={<a href="#questions">How to prepare a request example</a>}
      >
        <p>
          Find the information someone needs before they can act. Write a
          shorter request with a clear next step.
        </p>
      </TopicCard>
      <TopicCard
        title={<h3>Make a form easier to finish</h3>}
        action={<a href="#contact">Try the form example</a>}
      >
        <p>
          Group related fields, explain what is required and help someone
          recover when a value is missing.
        </p>
      </TopicCard>
    </TopicCards>
  );
}

export function Workshop() {
  return (
    <Container
      className="workshop-example"
      data-brand="consulting"
      id="workshop-top"
    >
      <Stack gap="xl">
        <header>
          <PageNavigation name="Workshop">
            <strong>Small changes workshop</strong>
            <a href="#topics">Topics</a>
            <a href="#questions">Questions</a>
            <a href="#contact">Try the form</a>
          </PageNavigation>
        </header>
        <Stack renderAs={<main />} gap="xl">
          <LandingIntro
            title="Make one everyday task easier"
            description="Choose a request or a form. Work through a concrete example, then leave with a change you can explain and test."
            note="Fictional workshop · local demonstration"
            action={
              <Button
                renderAs={<a href="#topics" aria-label="Explore the topics" />}
              >
                Explore the topics
              </Button>
            }
          />
          <Section id="topics" title="Choose a starting point">
            <WorkshopTopics />
          </Section>
          <Section id="questions" title="Before you start">
            <Questions items={workshopQuestions} />
          </Section>
          <Section
            id="contact"
            title="Try a workshop request"
            description="Use a fictional name to try the validation. Nothing is sent or stored after you leave this page."
          >
            <Container width="prose" flush>
              <Panel>
                <ContactForm />
              </Panel>
            </Container>
          </Section>
        </Stack>
        <PageFooter>
          <p>Small changes workshop · Fictional example</p>
          <a href="#workshop-top">Back to the top</a>
        </PageFooter>
      </Stack>
    </Container>
  );
}
