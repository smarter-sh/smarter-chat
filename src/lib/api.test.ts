import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { projectName, projectVersion } from "@/const";
import {
  API_URL,
  CONFIG_URL,
  PROMPT_URL,
  SESSION_KEY,
  config,
  promptErrorResponse,
  promptResponse,
  responseMessages,
} from "@/mocks/fixtures";
import type { ChatCookies, ClientContext } from "@/types";
import { server } from "@test/server";

import { SmarterApiError, errorMessage, fetchConfig, fetchPrompt, requestHeadersFactory, urlFactory } from "./api";
import { cookieMetaFactory, getCookie } from "./cookie";

const cookies: ChatCookies = {
  csrfCookie: cookieMetaFactory("csrftoken", null, "localhost"),
  sessionCookie: cookieMetaFactory("session_key", 60_000, "localhost"),
  debugCookie: cookieMetaFactory("debug", 60_000, "localhost"),
};
const context: ClientContext = { smarterClient: projectName, smarterClientVersion: projectVersion };

describe("urlFactory", () => {
  it("joins the api url and endpoint, with the session key", () => {
    expect(urlFactory("https://api.example.com/llm", "config/", "abc")).toBe(
      "https://api.example.com/llm/config/?session_key=abc",
    );
    expect(urlFactory("https://api.example.com/llm/", null, null)).toBe("https://api.example.com/llm/");
  });

  it("resolves a relative api url against the page", () => {
    expect(urlFactory("/workbench/llm-clients/x/", "config/", null)).toBe(
      "http://localhost:9357/workbench/llm-clients/x/config/",
    );
  });
});

describe("requestHeadersFactory", () => {
  beforeEach(() => {
    document.cookie = "csrftoken=the-csrf-token; path=/";
  });

  it("sends the CSRF token and identifies the client", () => {
    const headers = requestHeadersFactory(cookies, { ...context, smarterRequestId: "request-1" });
    expect(headers).toMatchObject({
      "X-CSRFToken": "the-csrf-token",
      "X-Smarter-Client": "@smarter.sh/ui-chat",
      "X-Smarter-ClientType": "react",
      "X-Smarter-RequestId": "request-1",
    });
    expect(headers.Authorization).toBeUndefined();
  });

  it("sends an api key as a token", () => {
    expect(requestHeadersFactory(cookies, { ...context, apiKey: "secret" }).Authorization).toBe("Token secret");
  });
});

describe("fetchConfig", () => {
  it("returns the configuration, and saves the chat session's key", async () => {
    let body: unknown;
    server.use(
      http.post(CONFIG_URL, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: config });
      }),
    );
    const result = await fetchConfig(API_URL, cookies, context);
    expect(result.chatbot.app_name).toBe("Stackademy");
    expect(body).toEqual({ session_key: "" });
    expect(getCookie(cookies.sessionCookie)).toBe(SESSION_KEY);
  });

  it("throws the api's error", async () => {
    server.use(http.post(CONFIG_URL, () => HttpResponse.json({ error: "Not found" }, { status: 404 })));
    await expect(fetchConfig(API_URL, cookies, context)).rejects.toThrow("Not found");
  });

  it("throws when the api does not return JSON", async () => {
    server.use(http.post(CONFIG_URL, () => HttpResponse.text("<html>Bad gateway</html>", { status: 502 })));
    await expect(fetchConfig(API_URL, cookies, context)).rejects.toBeInstanceOf(SmarterApiError);
  });

  it("throws when the configuration is incomplete", async () => {
    server.use(http.post(CONFIG_URL, () => HttpResponse.json({ data: {} })));
    await expect(fetchConfig(API_URL, cookies, context)).rejects.toThrow("incomplete");
  });
});

describe("fetchPrompt", () => {
  it("sends the session key and messages, and returns the response's messages", async () => {
    let body: unknown;
    let url = "";
    server.use(
      http.post(PROMPT_URL, async ({ request }) => {
        body = await request.json();
        url = request.url;
        return HttpResponse.json(promptResponse());
      }),
    );
    const messages = [{ role: "user", content: "hello" }];
    const result = await fetchPrompt(config, messages, cookies, context);
    expect(result).toEqual({ messages: responseMessages, error: null });
    expect(body).toEqual({ session_key: SESSION_KEY, messages });
    expect(url).toContain(`session_key=${SESSION_KEY}`);
  });

  it("returns a failed prompt's error, and its smarter_error message", async () => {
    server.use(http.post(PROMPT_URL, () => HttpResponse.json(promptErrorResponse(), { status: 401 })));
    const result = await fetchPrompt(config, [], cookies, context);
    expect(result.error).toBe("Incorrect API key provided.");
    expect(result.messages).toEqual([{ role: "smarter_error", content: "401 error: Incorrect API key provided." }]);
  });

  it("adds a smarter_error message when the error response has none", async () => {
    server.use(http.post(PROMPT_URL, () => HttpResponse.json({ error: "Server error" }, { status: 500 })));
    const result = await fetchPrompt(config, [], cookies, context);
    expect(result).toEqual({ messages: [{ role: "smarter_error", content: "Server error" }], error: "Server error" });
  });

  it("treats an unparsable body as an error", async () => {
    server.use(http.post(PROMPT_URL, () => HttpResponse.json({ data: { statusCode: 200, body: "{not json" } })));
    const result = await fetchPrompt(config, [], cookies, context);
    expect(result.error).toBe("The Smarter api returned http 200 OK");
  });
});

describe("errorMessage", () => {
  const response = new Response(null, { status: 400, statusText: "Bad Request" });

  it("reads the error, whatever its shape", () => {
    expect(errorMessage({ error: { message: "message" } }, response)).toBe("message");
    expect(errorMessage({ error: { description: "description" } }, response)).toBe("description");
    expect(errorMessage({ data: { error: "nested" } }, response)).toBe("nested");
    expect(errorMessage({}, response)).toBe("The Smarter api returned http 400 Bad Request");
  });
});
