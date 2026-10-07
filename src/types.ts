/**
 * Types for Smarter Chat: its props, its messages, and the data that the Smarter api returns.
 *
 * The api's types describe the fields that Smarter Chat reads. The api returns more, which the
 * Console displays as is. See smarter.apps.prompt.views.detailviews.prompt_config_view.PromptConfigView,
 * which returns the configuration with its legacy keys ("chatbot" for "llmclient").
 */
import type { MessageDirection, SenderRole } from "./lib/enums";

/** A message in the format of the OpenAI chat completion api, as the backend stores and returns them. */
export interface ApiMessage {
  role: string;
  content: string | null;
  [key: string]: unknown;
}

/** A message in the chat thread. */
export interface ChatMessage {
  /** The message's text, as html, for display. */
  message: string;
  /** The message's text, as sent to the api. */
  content: string | null;
  direction: MessageDirection;
  sender: SenderRole | string;
  sentTime: string;
  /** false for messages that are part of the thread, but never displayed, e.g. an assistant's tool calls. */
  display: boolean;
  /** The api's original message, whose other fields (e.g. tool_calls) are sent back to the api. */
  originalMessage?: ApiMessage;
}

/** The LLMClient, which the config api calls "chatbot". */
export interface ChatbotConfig {
  id: number;
  name: string;
  version?: string;
  provider: string;
  default_model: string;
  default_system_role: string;
  app_name: string;
  app_assistant: string;
  app_welcome_message: string;
  app_example_prompts: string[];
  app_placeholder: string;
  app_info_url?: string | null;
  app_file_attachment: boolean;
  /** The url of the LLMClient's prompt api. */
  url_chatbot: string;
  [key: string]: unknown;
}

export interface ChatHistory {
  chat_history?: ApiMessage[];
  prompt_tool_call_history?: unknown[];
  prompt_plugin_usage_history?: unknown[];
  chatbot_request_history?: unknown[];
  plugin_selector_history?: unknown[];
  /** Legacy names of prompt_tool_call_history and prompt_plugin_usage_history. */
  chat_tool_call_history?: unknown[];
  chat_plugin_usage_history?: unknown[];
  [key: string]: unknown;
}

export interface ChatMetaData {
  is_valid?: boolean;
  ready?: boolean;
  is_deployed?: boolean;
  [key: string]: unknown;
}

/** The LLMClient's configuration, from its config api. */
export interface ChatConfig {
  session_key: string;
  sandbox_mode: boolean;
  debug_mode: boolean;
  chatbot: ChatbotConfig;
  history: ChatHistory;
  meta_data: ChatMetaData;
  plugins: {
    meta_data: { total_plugins: number; plugins_returned: number };
    plugins: unknown[];
  };
  [key: string]: unknown;
}

/** A cookie that Smarter Chat reads, and possibly sets. */
export interface CookieMeta {
  name: string;
  /** milliseconds, for cookies that Smarter Chat sets. */
  expiration: number | null;
  /** The domain that the page's hostname must be in for the cookie to be read. */
  domain: string;
  /** A value to use instead of the cookie's. */
  value: string | null;
}

export interface ChatCookies {
  csrfCookie: CookieMeta;
  sessionCookie: CookieMeta;
  debugCookie: CookieMeta;
}

/** Who is calling the api, sent as the X-Smarter-* request headers. */
export interface ClientContext {
  smarterClient: string;
  smarterClientVersion: string;
  smarterRequestId?: string;
  /** An optional Smarter api key, sent as "Authorization: Token <apiKey>". */
  apiKey?: string | null;
}

export interface SmarterChatProps {
  /** The url of the LLMClient's api. example: https://smarter.3141-5926-5359.beta.api.smarter.sh/ */
  apiUrl: string;
  /** An optional Smarter api key, for LLMClients that require authentication. */
  apiKey?: string | null;
  /** Show the button that shows and hides the thread's metadata messages. */
  toggleMetadata?: boolean;
  /** The name of Django's CSRF cookie. */
  csrfCookieName?: string;
  /** Django's CSRF token, when the page cannot read the CSRF cookie. */
  csrftoken?: string | null;
  /** The name of the cookie in which Smarter Chat saves the debug mode. */
  debugCookieName?: string;
  debugCookieExpiration?: number;
  /** Log to the browser console. */
  debugMode?: boolean;
  /** The name of the cookie in which Smarter Chat saves the chat session's key. */
  sessionCookieName?: string;
  sessionCookieExpiration?: number;
  /** @deprecated Not used. Django's session cookie is sent with each request, as is. */
  authSessionCookieName?: string;
  /** Show the Console, which displays the chat's configuration and history. */
  showConsole?: boolean;
  /** The domain whose cookies Smarter Chat reads. example: platform.smarter.sh */
  cookieDomain?: string;
  /** A unique id of the page request, sent as the X-Smarter-RequestId header. */
  smarterRequestId?: string;
}
