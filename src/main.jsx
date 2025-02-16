console.log("main.jsx file is loaded");

import React from "react";
import ReactDOM from "react-dom/client";
import SmarterChat from "./components/SmarterChat/SmarterChat";
import "./styles.css";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const apiUrl = "http://smarter.3141-5926-5359.api.smarter.sh";
const apiKey = null;
const toggleMetadata = false;

const DEFAULT_COOKIE_EXPIRATION = 1000 * 60 * 60 * 24 * 1; // 1 day
const csrfCookieName = "csrftoken";
const debugCookieName = "debug";
const debugCookieExpiration = DEFAULT_COOKIE_EXPIRATION;
const sessionCookieName = "session_key";
const sessionCookieExpiration = DEFAULT_COOKIE_EXPIRATION;

const rootElement = document.getElementById("smarter-sh-v1-ui-chat-root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  console.log("Root element found. Rendering Smarter Chat...");
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
