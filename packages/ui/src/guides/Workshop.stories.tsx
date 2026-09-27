import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Workshop,
  WorkshopTopics,
  workshopQuestions,
} from "../../.storybook/examples/Workshop";
import {
  LandingIntro,
  PageFooter,
  PageNavigation,
  Questions,
} from "../../.storybook/examples/WorkshopPatterns";
import { ContactForm } from "../../.storybook/examples/ContactForm";

const meta = {
  title: "Patterns/Workshop",
  parameters: {
    layout: "padded",
    docs: { story: { inline: false, height: "720px" } },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = {
  parameters: { layout: "fullscreen", chromatic: { disableSnapshot: false } },
  render: () => <Workshop />,
};

export const Navigation: Story = {
  render: () => (
    <PageNavigation name="Example sections">
      <a href="#navigation-destination">Jump to the section</a>
      <span id="navigation-destination">Section destination</span>
    </PageNavigation>
  ),
};
export const Intro: Story = {
  render: () => (
    <LandingIntro
      title="Make one task easier"
      description="Choose an example and decide what someone needs to do next."
      note="Fictional workshop"
      action={<a href="#intro-destination">Read the details</a>}
    />
  ),
  decorators: [
    (Story) => (
      <>
        <Story />
        <p id="intro-destination">
          Bring one fictional example to work through.
        </p>
      </>
    ),
  ],
};
export const Topics: Story = {
  render: () => (
    <>
      <WorkshopTopics />
      <p id="questions">Choose a fictional request to work through.</p>
      <div id="contact">
        <ContactForm />
      </div>
    </>
  ),
};
export const FAQ: Story = {
  render: () => <Questions items={workshopQuestions} />,
};
export const Request: Story = { render: () => <ContactForm /> };
export const Footer: Story = {
  render: () => (
    <PageFooter>
      <p>This example uses local state and fictional content.</p>
    </PageFooter>
  ),
};
