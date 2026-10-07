/** The Console's menu items: the configuration, and the chat session's histories. */
export const MenuItems = {
  CHAT_CONFIG: "chat_config",
  CHATBOT_REQUEST_HISTORY: "chatbot_request_history",
  CHAT_TOOL_CALL_HISTORY: "chat_tool_call_history",
  CHAT_PLUGIN_USAGE_HISTORY: "chat_plugin_usage_history",
} as const;

export type MenuItem = (typeof MenuItems)[keyof typeof MenuItems];
