/** The data that the Console displays for each of its menu items. */
import type { ChatConfig } from "../../types";
import { MenuItems, type MenuItem } from "./enums";

/** The LLMClient's configuration, from its config api. Empty until it loads. */
export type ConsoleConfig = ChatConfig | Record<string, never> | null;

function isLoaded(config: ConsoleConfig): config is ChatConfig {
  return !!config && Object.keys(config).length > 0;
}

/** The JSON objects to display for a menu item. */
export function consoleData(config: ConsoleConfig, item: MenuItem): object[] {
  if (!isLoaded(config)) {
    return [];
  }
  const history = config.history ?? {};
  const list = (value: unknown, legacy?: unknown) =>
    Array.isArray(value) ? value : Array.isArray(legacy) ? legacy : [];
  switch (item) {
    case MenuItems.LLMCLIENT_REQUEST_HISTORY:
      return list(history.llmclient_request_history, history.chatbot_request_history);
    case MenuItems.CHAT_TOOL_CALL_HISTORY:
      return list(history.prompt_tool_call_history, history.chat_tool_call_history);
    case MenuItems.CHAT_PLUGIN_USAGE_HISTORY:
      return list(history.prompt_plugin_usage_history, history.chat_plugin_usage_history);
    default:
      return [config];
  }
}
