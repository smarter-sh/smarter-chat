// a tiny app for development and testing
import React from "react";
import ReactDOM from "react-dom/client";
import SmarterChat from "./components/SmarterChat/Component";
import "./styles.css";

const apiUrl = "https://platform.smarter.sh/chatbots/example/config/";
const apiKey = null;
const toggleMetadata = false;

const DEFAULT_COOKIE_EXPIRATION = 1000 * 60 * 60 * 24 * 1; // 1 day
const csrfCookieName = "csrftoken";
const debugCookieName = "debug";
const debugCookieExpiration = DEFAULT_COOKIE_EXPIRATION;
const sessionCookieName = "session_key";
const sessionCookieExpiration = DEFAULT_COOKIE_EXPIRATION;

ReactDOM.createRoot(document.getElementById("root")).render(
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
  </React.StrictMode>
);
