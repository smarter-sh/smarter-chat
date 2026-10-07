/** MSW request handlers for the Smarter api. See storybook/preview.ts and test/server.ts in the workspace. */
import { delay, http, HttpResponse } from "msw";

import type { ChatConfig } from "@/types";

import { CONFIG_URL, PROMPT_URL, config, configWithHistory, promptErrorResponse, promptResponse } from "./fixtures";

function configHandler(chatConfig: ChatConfig) {
  return http.post(CONFIG_URL, () => HttpResponse.json({ data: chatConfig, api: "smarter.sh/v1" }));
}

/** A new chat session, whose prompts succeed. */
export const chatHandlers = [configHandler(config), http.post(PROMPT_URL, () => HttpResponse.json(promptResponse()))];

/** A chat session in progress. */
export const historyHandlers = [
  configHandler(configWithHistory),
  http.post(PROMPT_URL, () => HttpResponse.json(promptResponse())),
];

/** The LLM provider rejects the prompt. */
export const promptErrorHandlers = [
  configHandler(config),
  http.post(PROMPT_URL, () => HttpResponse.json(promptErrorResponse(), { status: 401 })),
];

/** The configuration never arrives. */
export const loadingHandlers = [
  http.post(CONFIG_URL, async () => {
    await delay("infinite");
    return HttpResponse.json({});
  }),
];

/** The LLMClient doesn't exist, or the user may not use it. */
export const configErrorHandlers = [
  http.post(CONFIG_URL, () => HttpResponse.json({ error: "Not found" }, { status: 404 })),
];
