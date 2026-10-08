/**
 * The Smarter api calls of Smarter Chat: the LLMClient's configuration, and its prompts.
 *
 * Both are POSTs, with Django's CSRF token, and with the browser's cookies, so that the Smarter web
 * console's session authenticates them. Each response wraps its payload in "data". See:
 *
 * - smarter.apps.prompt.views.detailviews.prompt_config_view.PromptConfigView: <apiUrl>config/
 * - smarter.apps.llmclient.api.v1.views.base: the LLMClient's prompt api, chatbot.url_chatbot. Its
 *   payload is an AWS Lambda style response, whose body is a JSON string of the completion, with
 *   Smarter's own messages in body.smarter.messages. A failed prompt has the LLM provider's status,
 *   and its body is {error: {status, message}, response: <the completion>}, whose messages include a
 *   "smarter_error" message.
 *
 * A prompt can stream its progress, e.g. its tool calls and MCP server requests, as Server-Sent
 * Events: the request accepts text/event-stream, and the response is "progress" events, then a
 * "result" event with the same JSON as a non-streaming response. Servers that don't stream answer
 * with JSON, as before. See smarter.apps.prompt.progress.
 */
import type { ApiMessage, ChatConfig, ChatCookies, ClientContext } from "../types";
import { getCookie, setCookie } from "./cookie";
import { SenderRoleEnum } from "./enums";

const applicationJson = "application/json";
const textEventStream = "text/event-stream";

export class SmarterApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SmarterApiError";
    this.status = status;
  }
}

/** The result of a prompt: the messages to add to the thread, and the error, if it failed. */
export interface PromptResult {
  messages: ApiMessage[];
  error: string | null;
}

/** A step of a prompt that is still running, e.g. a tool call. */
export interface PromptProgressEvent {
  /** e.g. llm_request, tool_requested, tool_responded, plugin_called, mcp_tool_called */
  type: string;
  /** A short, human-readable description of the step. */
  message: string;
  [key: string]: unknown;
}

/** The http status of a response, as errorMessage() reads it. */
type ResponseStatus = Pick<Response, "status" | "statusText">;

/** The url of an api endpoint, relative to apiUrl, with the chat session's key. */
export function urlFactory(apiUrl: string, endpoint: string | null, sessionKey: string | null): string {
  const base = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
  const url = new URL(endpoint || "", new URL(base, window.location.href));
  if (sessionKey) {
    url.searchParams.append("session_key", sessionKey);
  }
  return url.toString();
}

/**
 * The request headers. Any custom header must also be in Django's CORS_ALLOW_HEADERS, in
 * smarter.settings.base, for pages on other domains.
 */
export function requestHeadersFactory(cookies: ChatCookies, context: ClientContext): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: applicationJson,
    "Content-Type": applicationJson,
    "X-CSRFToken": getCookie(cookies.csrfCookie, "") ?? "",
    "X-Smarter-Client": context.smarterClient,
    "X-Smarter-ClientVersion": context.smarterClientVersion,
    "X-Smarter-ClientType": "react",
  };
  if (context.smarterRequestId) {
    headers["X-Smarter-RequestId"] = context.smarterRequestId;
  }
  if (context.apiKey) {
    headers.Authorization = `Token ${context.apiKey}`;
  }
  return headers;
}

function requestInitFactory(headers: Record<string, string>, body: unknown): RequestInit {
  return {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers,
    body: JSON.stringify(body),
  };
}

/** The response's JSON, or a SmarterApiError when it isn't JSON. */
async function getJson(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes(applicationJson)) {
    const text = await response.text();
    throw new SmarterApiError(
      `Unexpected response from the Smarter api (http ${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

/** The error message of an api error response, whatever its shape. */
export function errorMessage(json: Record<string, unknown>, response: ResponseStatus): string {
  const error = (json.error ?? (json.data as Record<string, unknown> | undefined)?.error) as unknown;
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    const { message, description } = error as Record<string, unknown>;
    if (typeof message === "string") return message;
    if (typeof description === "string") return description;
  }
  return `The Smarter api returned http ${response.status} ${response.statusText}`.trim();
}

/**
 * The LLMClient's configuration. A new chat session's key, and the debug mode, are saved in their
 * cookies, for the next page load.
 */
export async function fetchConfig(apiUrl: string, cookies: ChatCookies, context: ClientContext): Promise<ChatConfig> {
  const sessionKey = getCookie(cookies.sessionCookie, "");
  const headers = requestHeadersFactory(cookies, context);
  const init = requestInitFactory(headers, { session_key: sessionKey });
  const response = await fetch(urlFactory(apiUrl, "config/", sessionKey), init);
  const json = await getJson(response);
  if (!response.ok) {
    throw new SmarterApiError(errorMessage(json, response), response.status);
  }
  const config = json.data as ChatConfig | undefined;
  if (!config || !config.chatbot) {
    throw new SmarterApiError("The Smarter api returned an incomplete configuration.", response.status);
  }
  setCookie(cookies.sessionCookie, config.session_key);
  setCookie(cookies.debugCookie, config.debug_mode);
  return config;
}

/** The completion in a prompt response's body, which is a JSON string. */
function parseBody(json: Record<string, unknown>): Record<string, unknown> | null {
  const body = (json.data as Record<string, unknown> | undefined)?.body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
}

function smarterMessages(completion: Record<string, unknown> | null | undefined): ApiMessage[] {
  const smarter = completion?.smarter as { messages?: ApiMessage[] } | undefined;
  return Array.isArray(smarter?.messages) ? smarter.messages : [];
}

/**
 * Reads a Server-Sent Events stream, and calls onEvent with each event's name and data. Comments
 * (e.g. keepalives) and retry hints are ignored.
 */
export async function readEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: string, data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (frame: string) => {
    let event = "message";
    const data: string[] = [];
    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    if (data.length > 0) onEvent(event, data.join("\n"));
  };

  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n?/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      dispatch(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
  if (buffer.trim()) dispatch(buffer);
}

/**
 * The api's JSON, and its http status, from a prompt's event stream. Progress events are passed to
 * onProgress as they arrive.
 */
async function readPromptEventStream(
  response: Response,
  onProgress: (event: PromptProgressEvent) => void,
): Promise<{ json: Record<string, unknown>; status: number }> {
  // assigned in a callback, which typescript's narrowing doesn't see.
  const received: { result: { status?: number; response?: Record<string, unknown> } | null } = { result: null };
  if (!response.body) {
    throw new SmarterApiError("The Smarter api returned an empty event stream.", response.status);
  }
  await readEventStream(response.body, (event, data) => {
    try {
      if (event === "progress") onProgress(JSON.parse(data) as PromptProgressEvent);
      else if (event === "result") received.result = JSON.parse(data) as typeof received.result;
    } catch {
      // a malformed event. The result is required, below; progress is optional.
    }
  });
  if (!received.result) {
    throw new SmarterApiError("The Smarter api's event stream ended without a result.", response.status);
  }
  const { status, response: json } = received.result;
  return { json: json ?? {}, status: status ?? response.status };
}

interface CompletionUsage {
  completion_tokens?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
}

/**
 * A "smarter" message that explains a completion that the LLM stopped because it reached the
 * LLMClient's max tokens, i.e. whose finish_reason is "length", or null. A reasoning model can
 * spend all of its tokens reasoning, and then return an empty response, which is otherwise
 * displayed as nothing at all.
 */
export function maxTokensMessage(completion: Record<string, unknown> | null | undefined): ApiMessage | null {
  const choices = completion?.choices as
    { finish_reason?: string; message?: { content?: string | null } }[] | undefined;
  const choice = Array.isArray(choices) ? choices[0] : undefined;
  if (choice?.finish_reason !== "length") return null;
  const usage = completion?.usage as CompletionUsage | undefined;
  const tokens = usage?.completion_tokens;
  const reasoning = usage?.completion_tokens_details?.reasoning_tokens;
  const limit = tokens ? ` of ${tokens} completion tokens` : "";
  const spent = reasoning ? `, ${reasoning} of which it spent reasoning` : "";
  const outcome = choice.message?.content ? "so its response is incomplete" : "so its response is empty";
  return {
    role: SenderRoleEnum.SMARTER,
    content: `The LLM reached this LLMClient's max tokens${limit}${spent}, ${outcome}. Raise defaultMaxTokens in the LLMClient's manifest.`,
  };
}

/** The result of a prompt, from the api's JSON and http status. */
function promptResult(json: Record<string, unknown>, response: ResponseStatus): PromptResult {
  const body = parseBody(json);
  const statusCode = (json.data as Record<string, unknown> | undefined)?.statusCode;
  const ok = response.status >= 200 && response.status < 300;

  if (ok && (statusCode === undefined || statusCode === 200) && body) {
    const truncated = maxTokensMessage(body);
    return { messages: truncated ? [...smarterMessages(body), truncated] : smarterMessages(body), error: null };
  }

  // a failed prompt: the provider's error, with the messages of the backend's response, if any.
  const bodyError = body?.error as { message?: string } | undefined;
  const error = bodyError?.message || errorMessage(json, response);
  const returned = smarterMessages(body?.response as Record<string, unknown> | undefined);
  const hasErrorMessage = returned.some((message) => message.role === SenderRoleEnum.SMARTER_ERROR);
  return {
    messages: hasErrorMessage ? returned : [...returned, { role: SenderRoleEnum.SMARTER_ERROR, content: error }],
    error,
  };
}

/**
 * Sends the thread to the LLMClient's prompt api. Resolves to the messages to add to the thread.
 * A failed prompt resolves too, with its error, and with a "smarter_error" message to display.
 *
 * With onProgress, the prompt's progress is requested as Server-Sent Events, and each step is
 * passed to onProgress while the prompt runs.
 */
export async function fetchPrompt(
  config: ChatConfig,
  messages: ApiMessage[],
  cookies: ChatCookies,
  context: ClientContext,
  onProgress?: (event: PromptProgressEvent) => void,
): Promise<PromptResult> {
  const sessionKey = getCookie(cookies.sessionCookie, "") || config.session_key;
  const headers = requestHeadersFactory(cookies, context);
  if (onProgress) {
    headers.Accept = `${textEventStream}, ${applicationJson}`;
  }
  const init = requestInitFactory(headers, { session_key: sessionKey, messages });
  const response = await fetch(urlFactory(config.chatbot.url_chatbot, null, sessionKey), init);

  const contentType = response.headers.get("content-type") ?? "";
  if (onProgress && contentType.includes(textEventStream)) {
    const { json, status } = await readPromptEventStream(response, onProgress);
    return promptResult(json, { status, statusText: "" });
  }
  return promptResult(await getJson(response), response);
}
