/** The Console's menu items: the configuration, the chat session's histories, and the server logs. */
export const MenuItems = {
  CHAT_CONFIG: "chat_config",
  LLMCLIENT_REQUEST_HISTORY: "llmclient_request_history",
  CHAT_TOOL_CALL_HISTORY: "chat_tool_call_history",
  CHAT_PLUGIN_USAGE_HISTORY: "chat_plugin_usage_history",
  SERVER_LOGS: "server_logs",
} as const;

export type MenuItem = (typeof MenuItems)[keyof typeof MenuItems];
