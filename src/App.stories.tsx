import type { Meta, StoryObj } from "@storybook/react-vite";

import { props } from "@/mocks/fixtures";
import { chatHandlers, historyHandlers } from "@/mocks/handlers";

import App from "@/App";

/** Smarter Chat, as the web console's LLMClient prompt workbench renders it, with its api mocked. */
const meta = {
  title: "Smarter Chat/App",
  component: App,
  args: props,
  decorators: [
    (Story) => (
      <div style={{ height: "88vh" }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen", msw: { handlers: chatHandlers } },
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A chat session in progress, restored from its history. */
export const WithHistory: Story = {
  parameters: { msw: { handlers: historyHandlers } },
};
