import type { Meta, StoryObj } from "@storybook/react-vite";

import { config, configWithHistory } from "@/mocks/fixtures";

import Console from "./Component";

/** The Console: the LLMClient's configuration, and the chat session's histories, as JSON. */
const meta = {
  title: "Smarter Chat/Console",
  component: Console,
  args: { config },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A chat session in progress, with api calls, tool calls and plugin usage. */
export const WithHistory: Story = {
  args: { config: configWithHistory },
};

/** Before the configuration arrives. */
export const Empty: Story = {
  args: { config: null },
};
