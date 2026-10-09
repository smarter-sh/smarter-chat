/**
 * Example data for this package's stories and tests: what the Smarter api returns. The
 * configuration is a trimmed copy of a real response of the config api, for the stackademy_sql
 * LLMClient. See smarter.apps.prompt.views.detailviews.prompt_config_view.PromptConfigView.
 */
import type { ApiMessage, ChatConfig, SmarterChatProps } from "@/types";

export const API_URL = "http://localhost:9357/workbench/llm-clients/rMTAwMDAwMQx/";
export const CONFIG_URL = `${API_URL}config/`;
export const PROMPT_URL = "http://localhost:9357/api/v1/llm-clients/rMTAwMDAwMQx/prompt/";
export const LOG_STREAM_URL = "http://localhost:9357/dashboard/logs/api/stream/";
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

/**
 * The prompt api's response: an AWS Lambda style response, whose body is a JSON string. The
 * completion's fields, e.g. its choices and usage, can be overridden.
 */
export function promptResponse(
  messages: ApiMessage[] = responseMessages,
  statusCode = 200,
  overrides: Record<string, unknown> = {},
) {
  const completion = {
    id: "chatcmpl-123",
    object: "chat.completion",
    choices: [{ index: 0, finish_reason: "stop", message: messages[messages.length - 1] }],
    smarter: { plugins: ["stackademy_sql"], messages },
    ...overrides,
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

/**
 * The response of a prompt that a reasoning model stopped at the LLMClient's max tokens: it spent
 * them all reasoning, so its response is empty.
 */
export function promptMaxTokensResponse() {
  const messages: ApiMessage[] = [
    { role: "assistant", content: "" },
    {
      role: "smarter",
      content: "openai prompt charges: 3538 prompt tokens, 256 completion tokens = 3794 total tokens charged.",
    },
  ];
  return promptResponse(messages, 200, {
    choices: [{ index: 0, finish_reason: "length", message: { role: "assistant", content: "" } }],
    usage: { completion_tokens: 256, completion_tokens_details: { reasoning_tokens: 256 } },
  });
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

/** A small png, as a data url, so that the stories' images need no network. */
export const IMAGE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAIAAACwpMoFAAABK0lEQVR42u3b0S0DAACE4ZulL7zfMIg2JUiZohoVBMEUKghC05rubGCA6598G/yPl1N2jGLKrlFM2TOKKftGMWVoFFNGRjFlbBRTDoxiyqFRTDkyiinHRjHlxCimTIxiyqlRTDkzimlre4BiBCYwCAwCg8AgMAgMAhMYBAaBQWAQGATGP4EzNYop50YxZWYUUy6MYsrcKKZcGsWUK6OYcm0UU26MYsqtUUy5M4op90Yx5cEopjwaxZQnoxh7MIM/CAwCg8AgMAgMAhMYBAaBQWAQGAQGgTf4XfhsFFMWRjHlxSimvBrFlDejmPJuFFM+jGLKp1FM+TKKKd9GMeXHKKYsjWLKyiimrI1iyq9RjD2YwR8EBoFBYBAYBAaBCQwCg8AgMAgMAoPAG+sPxer85czgf1MAAAAASUVORK5CYII=";

/** A chat session whose assistant replied with markdown images: one inline, one linked. */
export const configWithImages = makeConfig({
  history: {
    ...config.history,
    chat_history: [
      { role: "system", content: "You are a helpful assistant. DO NOT GUESS." },
      { role: "user", content: "Show me the course banner." },
      {
        role: "assistant",
        content: `Here is the course banner:\n\n![CS210 course banner](${IMAGE_DATA_URL})\n\nand the catalogue, linked:\n\n[![the catalogue](${IMAGE_DATA_URL})](https://stackademy.edu)`,
      },
    ],
  },
});

/** A configuration whose history has a code block, which is highlighted, with a copy button. */
export const configWithCode = makeConfig({
  history: {
    ...config.history,
    chat_history: [
      { role: "system", content: "You are a helpful assistant. DO NOT GUESS." },
      { role: "user", content: "How do I enroll in CS210 from Python?" },
      {
        role: "assistant",
        content: 'Like this:\n\n```python\nimport stackademy\n\nstackademy.enroll("CS210")\n```',
      },
    ],
  },
});

/** A configuration whose history has math, in LaTeX, which is typeset: inline, and displayed. */
export const configWithMath = makeConfig({
  history: {
    ...config.history,
    chat_history: [
      { role: "system", content: "You are a helpful assistant. DO NOT GUESS." },
      { role: "user", content: "What is the Fibonacci sequence?" },
      {
        role: "assistant",
        content: String.raw`Each term is the sum of the two before it: \(F_n = F_{n-1} + F_{n-2}\), with \(F_0 = 0\) and \(F_1 = 1\). The ratio of consecutive terms approaches the golden ratio:

\[
\varphi = \lim_{n \to \infty} \frac{F_{n+1}}{F_n} = \frac{1 + \sqrt{5}}{2} \approx 1.618
\]`,
      },
    ],
  },
});

/** The progress of a prompt that calls a tool and an MCP server, as the prompt api streams it. */
export const progressEvents = [
  { type: "llm_request", message: "Sending the prompt to the LLM", iteration: 1 },
  { type: "tool_requested", message: "Calling tool stackademy_sql", tool: "stackademy_sql", arguments: "{}" },
  {
    type: "mcp_tool_called",
    message: "Calling MCP server github: search_code",
    mcpclient: "github",
    tool: "search_code",
  },
  { type: "tool_responded", message: "Tool stackademy_sql responded", tool: "stackademy_sql" },
  { type: "llm_request", message: "Sending the tool results to the LLM", iteration: 2 },
];

/** A prompt api response as Server-Sent Events: its progress, keepalives, and then its result. */
export function promptEventStream(
  events: object[] = progressEvents,
  response: object = promptResponse(),
  status = 200,
): string {
  const frames = events.map((event) => `event: progress\ndata: ${JSON.stringify(event)}\n\n`);
  return [
    "retry: 3000\n\n",
    ...frames,
    ": keepalive\n\n",
    `event: result\ndata: ${JSON.stringify({ status, response })}\n\n`,
  ].join("");
}

/** The user's recent server logs, which the log stream sends first, as its "bulk" event. */
export const bulkLogs = [
  {
    message: "2026-01-01 12:00:00,000 INFO \u001b[1;34msmarter.apps.prompt\u001b[0m prompt started",
    level: "INFO",
    logger: "smarter.apps.prompt",
    timestamp: 1767268800,
  },
  {
    message: "2026-01-01 12:00:01,000 WARNING plugin stackademy_sql is slow",
    level: "WARNING",
    logger: "smarter.apps.plugin",
    timestamp: 1767268801,
  },
];

/** A server log record that arrives after the bulk history. */
export const liveLog = {
  message: "2026-01-01 12:00:02,000 ERROR \u001b[31mprompt finished\u001b[0m",
  level: "ERROR",
  logger: "smarter.apps.prompt",
  timestamp: 1767268802,
};
