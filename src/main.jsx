import React from "react";
import ReactDOM from "react-dom/client";
import SmarterChat from "./components/SmarterChat/SmarterChat";
import { CHATBOT_API_URL, REACT_ROOT_ELEMENT_ID } from "./shared/constants";
import "./styles.css";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const apiKey = null;

const DEFAULT_COOKIE_EXPIRATION = 1000 * 60 * 60 * 24 * 1; // 1 day
const csrfCookieName = "csrftoken";
const debugCookieName = "debug";
const debugCookieExpiration = DEFAULT_COOKIE_EXPIRATION;
const sessionCookieName = "session_key";
const sessionCookieExpiration = DEFAULT_COOKIE_EXPIRATION;

const rootElement = document.getElementById(REACT_ROOT_ELEMENT_ID);
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  const apiUrl = rootElement.getAttribute("smarter-chatbot-api-url") || CHATBOT_API_URL;
  const toggleMetadata = rootElement.getAttribute("smarter-toggle-metadata") === "true";

  root.render(
    <React.StrictMode>
      <SmarterChat
        apiUrl={apiUrl}
        apiKey={apiKey}
        toggleMetadata={toggleMetadata}
        csrfCookieName={csrfCookieName}
        debugCookieName={debugCookieName}
        debugCookieExpiration={debugCookieExpiration}
        sessionCookieName={sessionCookieName}
        sessionCookieExpiration={sessionCookieExpiration}
      />
    </React.StrictMode>,
  );
} else {
  console.error(
    "Root element not found. Begin your trouble shooting journey here: https://github.com/smarter-sh/smarter-chat/blob/main/src/main.jsx",
  );
}

// Register the service worker
//serviceWorkerRegistration.register();
