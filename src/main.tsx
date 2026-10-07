import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { loggerPrefix } from "@/const.tsx";
import type { SmarterChatProps } from "@/types";
import App from "./App.tsx";

/*
 * The root element's attributes. See templates/react/smarter-chat.html, and
 * smarter.apps.prompt.views.detailviews.prompt_workbench_view.PromptWorkbenchView.
 */
const rootEl = document.getElementById("smarter-chat-root");
if (!rootEl) throw new Error("Root element not found");

const isTrue = (value: string | null) => value?.toLowerCase() === "true";

const apiUrl = rootEl.getAttribute("smarter-llmclient-api-url");
const csrfCookieName = rootEl.getAttribute("smarter-csrf-cookie-name");
const sessionCookieName = rootEl.getAttribute("smarter-session-cookie-name");
const cookieDomain = rootEl.getAttribute("smarter-cookie-domain") || window.location.hostname;
const toggleMetadata = isTrue(rootEl.getAttribute("smarter-toggle-metadata"));
const debugMode = isTrue(rootEl.getAttribute("react-debug-mode"));
const smarterRequestId = rootEl.getAttribute("smarter-request-id") || "";
const logStreamUrl = rootEl.getAttribute("smarter-log-stream-url") || null;

if (!apiUrl) throw new Error("LLMClient API URL not found in root element attributes");
if (!csrfCookieName) throw new Error("CSRF cookie name not found in root element attributes");
if (!sessionCookieName) throw new Error("Session cookie name not found in root element attributes");
if (!smarterRequestId) throw new Error("Smarter request ID not found in root element attributes");

const props: SmarterChatProps = {
  apiUrl,
  csrfCookieName,
  sessionCookieName,
  cookieDomain,
  toggleMetadata,
  debugMode,
  smarterRequestId,
  logStreamUrl,
};

console.debug(`${loggerPrefix} initialized with:`, props);

createRoot(rootEl).render(
  <StrictMode>
    <App {...props} />
  </StrictMode>,
);
