import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FakeEventSource, installFakes } from "@/mocks/fakes";
import { LOG_STREAM_URL, bulkLogs, config, configWithHistory, liveLog } from "@/mocks/fixtures";

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

  it("lists Config last", () => {
    render(<Console config={configWithHistory} />);
    const labels = screen.getAllByRole("button").map((button) => button.textContent);
    expect(labels).toEqual(["Api Calls", "Tool Calls", "Plugin Usage", "Config"]);
  });

  it("lists the server logs first, selects them, and keeps streaming them while another tab is selected", async () => {
    installFakes();
    const user = userEvent.setup();
    render(<Console config={configWithHistory} logStreamUrl={LOG_STREAM_URL} />);
    const labels = screen.getAllByRole("button").map((button) => button.textContent);
    expect(labels).toEqual(["Server Logs", "Api Calls", "Tool Calls", "Plugin Usage", "Config"]);
    expect(screen.getByRole("button", { name: "Server Logs" })).toHaveAttribute("aria-pressed", "true");

    const output = screen.getByRole("log", { name: "Console output" });
    expect(output).toHaveTextContent("Connecting to the server log stream...");
    const stream = FakeEventSource.latest();
    expect(stream.url).toBe(LOG_STREAM_URL);
    act(() => stream.open());
    expect(output).toHaveTextContent("Streaming server logs... There are none yet.");
    act(() => stream.emit(bulkLogs, "bulk"));
    expect(output).toHaveTextContent("INFO prompt started");
    expect(output).toHaveTextContent("WARNING plugin stackademy_sql is slow");

    await user.click(screen.getByRole("button", { name: "Config" }));
    act(() => stream.emit(liveLog));
    expect(output).not.toHaveTextContent("prompt finished");
    await user.click(screen.getByRole("button", { name: "Server Logs" }));
    expect(screen.getByText("prompt finished")).toHaveClass("console-log-error");
    expect(FakeEventSource.instances).toHaveLength(1);

    act(() => stream.emit({ message: "no level" }));
    expect(screen.getByText("no level")).toHaveClass("console-log-info");
    act(() => stream.fail());
    expect(output).toHaveTextContent("The log stream disconnected. Reconnecting...");
    vi.unstubAllGlobals();
  });

  it("says when a history is empty", async () => {
    const user = userEvent.setup();
    render(<Console config={config} />);
    await user.click(screen.getByRole("button", { name: "Plugin Usage" }));
    expect(screen.getByText("No plugin usage in this chat session yet.")).toBeInTheDocument();
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
    expect(consoleData(configWithHistory, MenuItems.LLMCLIENT_REQUEST_HISTORY)).toBe(history.llmclient_request_history);
    expect(consoleData(configWithHistory, MenuItems.CHAT_TOOL_CALL_HISTORY)).toBe(history.prompt_tool_call_history);
    expect(consoleData(configWithHistory, MenuItems.CHAT_PLUGIN_USAGE_HISTORY)).toBe(
      history.prompt_plugin_usage_history,
    );
  });

  it("reads the legacy history names", () => {
    const legacy = {
      ...config,
      history: {
        chat_tool_call_history: [{ id: 1 }],
        chat_plugin_usage_history: [{ id: 2 }],
        chatbot_request_history: [{ id: 3 }],
      },
    };
    expect(consoleData(legacy, MenuItems.CHAT_TOOL_CALL_HISTORY)).toEqual([{ id: 1 }]);
    expect(consoleData(legacy, MenuItems.CHAT_PLUGIN_USAGE_HISTORY)).toEqual([{ id: 2 }]);
    expect(consoleData(legacy, MenuItems.LLMCLIENT_REQUEST_HISTORY)).toEqual([{ id: 3 }]);
  });

  it("returns nothing for the server logs, which are streamed", () => {
    expect(consoleData(configWithHistory, MenuItems.SERVER_LOGS)).toEqual([]);
  });

  it("returns nothing before the configuration loads", () => {
    expect(consoleData(null, MenuItems.CHAT_CONFIG)).toEqual([]);
    expect(consoleData({}, MenuItems.CHAT_CONFIG)).toEqual([]);
  });
});
