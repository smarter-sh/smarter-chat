import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { props } from "@/mocks/fixtures";
import {
  chatHandlers,
  configErrorHandlers,
  historyHandlers,
  loadingHandlers,
  promptErrorHandlers,
} from "@/mocks/handlers";

import SmarterChat from "./Component";

/** A chat with a Smarter LLMClient, with the Console beside it. */
const meta = {
  title: "Smarter Chat/SmarterChat",
  component: SmarterChat,
  args: props,
  decorators: [
    (Story) => (
      <div style={{ height: "88vh" }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen", msw: { handlers: chatHandlers } },
} satisfies Meta<typeof SmarterChat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A new chat session: the welcome message and example prompts. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Welcome to Stackademy! How can I help you today?")).toBeInTheDocument();
  },
};

/** A chat session in progress, restored from its history. */
export const WithHistory: Story = {
  parameters: { msw: { handlers: historyHandlers } },
};

/** The user sends a prompt, and the response's messages are added to the thread. */
export const SendPrompt: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Welcome to Stackademy! How can I help you today?");
    await userEvent.click(canvas.getByRole("textbox", { name: "Message" }));
    await userEvent.keyboard("Do you offer any courses on AI?{Enter}");
    await expect(await canvas.findByText("We offer CS210 Artificial Intelligence, for $700.00.")).toBeInTheDocument();
  },
};

/** The LLM provider rejects the prompt, and its error is displayed in the thread. */
export const PromptError: Story = {
  parameters: { msw: { handlers: promptErrorHandlers } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Welcome to Stackademy! How can I help you today?");
    await userEvent.click(canvas.getByRole("textbox", { name: "Message" }));
    await userEvent.keyboard("hello{Enter}");
    await expect(await canvas.findByText("401 error: Incorrect API key provided.")).toBeInTheDocument();
  },
};

/** The configuration has not arrived yet. */
export const Loading: Story = {
  parameters: { msw: { handlers: loadingHandlers } },
};

/** The configuration api failed. */
export const ConfigError: Story = {
  parameters: { msw: { handlers: configErrorHandlers } },
};

/** The chat alone, without the Console, e.g. on a bespoke web page. */
export const WithoutConsole: Story = {
  args: { showConsole: false, toggleMetadata: false },
};
