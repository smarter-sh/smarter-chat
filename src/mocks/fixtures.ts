/**
 * Example data for this package's stories and tests: what the Smarter api returns. The
 * configuration is a trimmed copy of a real response of the config api, for the stackademy_sql
 * LLMClient. See smarter.apps.prompt.views.detailviews.prompt_config_view.PromptConfigView.
 */
import type { ApiMessage, ChatConfig, SmarterChatProps } from "@/types";

export const API_URL = "http://localhost:9357/workbench/llm-clients/rMTAwMDAwMQx/";
export const CONFIG_URL = `${API_URL}config/`;
export const PROMPT_URL = "http://localhost:9357/api/v1/llm-clients/rMTAwMDAwMQx/prompt/";
export const SESSION_KEY = "e019a5c1cb2c1cb87992d2d03bccaf44c9d98406b46de5516a4fa03650038ac8";

export const props: SmarterChatProps = {
  apiUrl: API_URL,
  toggleMetadata: true,
  csrfCookieName: "csrftoken",
  sessionCookieName: "session_key",
  cookieDomain: "localhost",
  smarterRequestId: "storybook-request-id",
};

export const examplePrompts = [
  "Do you offer any courses on AI?",
  "My budget is $1,000. What courses can I take?",
  "I want to study programming. What do you suggest?",
];

export function makeConfig(overrides: Partial<ChatConfig> = {}): ChatConfig {
  return {
    session_key: SESSION_KEY,
    sandbox_mode: true,
    debug_mode: false,
    chatbot: {
      id: 1,
      url_chatbot: PROMPT_URL,
      user_profile: {
        user: { username: "admin", email: "admin@smarter.sh" },
        account: { accountNumber: "3141-5926-5359" },
      },
      default_system_role: "You are a helpful assistant. DO NOT GUESS.",
      name: "stackademy_sql",
      description: "Stackademy University course catalogue inquiries using the Stackademy SQL plugin.",
      version: "1.0.0",
      deployed: false,
      provider: "openai",
      default_model: "gpt-4o-mini",
      default_temperature: 1.0,
      default_max_tokens: 1024,
      app_name: "Stackademy",
      app_assistant: "Stanley",
      app_welcome_message: "Welcome to Stackademy! How can I help you today?",
      app_example_prompts: examplePrompts,
      app_placeholder: "Ask me anything about Stackademy courses...",
      app_info_url: "https://stackademy.edu/online-courses",
      app_file_attachment: false,
    },
    history: {
      chat_history: [],
      prompt_tool_call_history: [],
      prompt_plugin_usage_history: [],
      llmclient_request_history: [],
      plugin_selector_history: [],
    },
    meta_data: {
      ready: true,
      is_deployed: false,
      is_chatbot_sandbox_url: true,
      url: CONFIG_URL,
    },
    plugins: {
      meta_data: { total_plugins: 1, plugins_returned: 1 },
      plugins: [{ id: 1, plugin_meta: { name: "stackademy_sql", plugin_class: "sql", version: "0.1.0" }, chatbot: 1 }],
    },
    ...overrides,
  };
}

export const config = makeConfig();

/** A chat session in progress, whose history the config api returns. */
export const chatHistory: ApiMessage[] = [
  { role: "system", content: "You are a helpful assistant. DO NOT GUESS." },
  { role: "assistant", content: "Welcome to Stackademy! How can I help you today?" },
  { role: "user", content: "Do you offer any courses on AI?" },
  {
    role: "assistant",
    content: null,
    tool_calls: [{ id: "call_1", type: "function", function: { name: "stackademy_sql", arguments: "{}" } }],
  },
  {
    role: "tool",
    tool_call_id: "call_1",
    content: '[{"course_code": "CS210", "course_name": "Artificial Intelligence"}]',
  },
  { role: "assistant", content: "Yes! CS210 Artificial Intelligence. See [the catalogue](https://stackademy.edu)." },
];

export const configWithHistory = makeConfig({
  history: {
    ...config.history,
    chat_history: chatHistory,
    prompt_tool_call_history: [{ id: 1, function_name: "stackademy_sql", function_args: "{}" }],
    prompt_plugin_usage_history: [{ id: 1, input_text: "Do you offer any courses on AI?", plugin: 16 }],
    llmclient_request_history: [{ id: 1, request: { session_key: SESSION_KEY, messages: chatHistory.slice(0, 3) } }],
  },
});

/** The messages that the prompt api adds to the thread, in body.smarter.messages. */
export const responseMessages: ApiMessage[] = [
  { role: "smarter", content: "Smarter selected the stackademy_sql plugin." },
  { role: "assistant", content: "We offer CS210 Artificial Intelligence, for $700.00." },
];

/** The prompt api's response: an AWS Lambda style response, whose body is a JSON string. */
export function promptResponse(messages: ApiMessage[] = responseMessages, statusCode = 200) {
  const completion = {
    id: "chatcmpl-123",
    object: "chat.completion",
    choices: [{ index: 0, finish_reason: "stop", message: messages[messages.length - 1] }],
    smarter: { plugins: ["stackademy_sql"], messages },
  };
  return {
    data: {
      isBase64Encoded: false,
      statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(completion),
    },
    api: "smarter.sh/v1",
  };
}

/** A failed prompt's response: the provider's error, and the completion, with its smarter_error message. */
export function promptErrorResponse(message = "Incorrect API key provided.", statusCode = 401) {
  const response = {
    id: "chatcmpl-error",
    object: "chat.completion",
    smarter: { messages: [{ role: "smarter_error", content: `${statusCode} error: ${message}` }] },
  };
  return {
    data: {
      isBase64Encoded: false,
      statusCode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: { status: statusCode, message }, response }),
    },
    api: "smarter.sh/v1",
  };
}
