import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { config, configWithHistory } from "@/mocks/fixtures";

import Console from "./Component";
import { consoleData } from "./data";
import { MenuItems } from "./enums";

describe("Console", () => {
  it("displays the configuration, then each history that the user selects", async () => {
    const user = userEvent.setup();
    render(<Console config={configWithHistory} />);
    expect(screen.getByRole("button", { name: "Config" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText(/"stackademy_sql"/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Tool Calls" }));
    expect(screen.getByRole("button", { name: "Tool Calls" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Config" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("function_name")).toBeInTheDocument();
  });

  it("displays only the shell's prompt before the configuration loads", () => {
    render(<Console config={null} />);
    expect(screen.getByRole("log", { name: "Console output" })).toHaveTextContent(/Last login: .* from 192\.168\./);
  });
});

describe("consoleData", () => {
  it("returns each menu item's data", () => {
    const history = configWithHistory.history;
    expect(consoleData(configWithHistory, MenuItems.CHAT_CONFIG)).toEqual([configWithHistory]);
    expect(consoleData(configWithHistory, MenuItems.CHATBOT_REQUEST_HISTORY)).toBe(history.chatbot_request_history);
    expect(consoleData(configWithHistory, MenuItems.CHAT_TOOL_CALL_HISTORY)).toBe(history.prompt_tool_call_history);
    expect(consoleData(configWithHistory, MenuItems.CHAT_PLUGIN_USAGE_HISTORY)).toBe(
      history.prompt_plugin_usage_history,
    );
  });

  it("reads the legacy history names", () => {
    const legacy = {
      ...config,
      history: { chat_tool_call_history: [{ id: 1 }], chat_plugin_usage_history: [{ id: 2 }] },
    };
    expect(consoleData(legacy, MenuItems.CHAT_TOOL_CALL_HISTORY)).toEqual([{ id: 1 }]);
    expect(consoleData(legacy, MenuItems.CHAT_PLUGIN_USAGE_HISTORY)).toEqual([{ id: 2 }]);
    expect(consoleData(legacy, MenuItems.CHATBOT_REQUEST_HISTORY)).toEqual([]);
  });

  it("returns nothing before the configuration loads", () => {
    expect(consoleData(null, MenuItems.CHAT_CONFIG)).toEqual([]);
    expect(consoleData({}, MenuItems.CHAT_CONFIG)).toEqual([]);
  });
});
