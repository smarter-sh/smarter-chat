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
 */
import type { ApiMessage, ChatConfig, ChatCookies, ClientContext } from "../types";
import { getCookie, setCookie } from "./cookie";
import { SenderRoleEnum } from "./enums";

const applicationJson = "application/json";

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
export function errorMessage(json: Record<string, unknown>, response: Response): string {
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
 * Sends the thread to the LLMClient's prompt api. Resolves to the messages to add to the thread.
 * A failed prompt resolves too, with its error, and with a "smarter_error" message to display.
 */
export async function fetchPrompt(
  config: ChatConfig,
  messages: ApiMessage[],
  cookies: ChatCookies,
  context: ClientContext,
): Promise<PromptResult> {
  const sessionKey = getCookie(cookies.sessionCookie, "") || config.session_key;
  const headers = requestHeadersFactory(cookies, context);
  const init = requestInitFactory(headers, { session_key: sessionKey, messages });
  const response = await fetch(urlFactory(config.chatbot.url_chatbot, null, sessionKey), init);
  const json = await getJson(response);
  const body = parseBody(json);
  const statusCode = (json.data as Record<string, unknown> | undefined)?.statusCode;

  if (response.ok && (statusCode === undefined || statusCode === 200) && body) {
    return { messages: smarterMessages(body), error: null };
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
