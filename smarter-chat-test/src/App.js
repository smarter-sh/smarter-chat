import React from "react";
import ReactDOM from "react-dom/client";

import "./App.css";

import { SmarterChat } from "@smarter.sh/ui-chat";
import "@smarter.sh/ui-chat/dist/ui-chat.css";

const rootElement = document.getElementById("smarter-sh-v1-ui-chat-root");
const apiUrl = rootElement.getAttribute("smarter-chatbot-api-url") || "http://localhost:9357/api/v1/chatbots/1/";
const toggleMetadata = rootElement.getAttribute("smarter-toggle-metadata") === "true";
const csrfCookieName = rootElement.getAttribute("smarter-csrf-cookie-name") || "csrftoken";
const sessionCookieName = rootElement.getAttribute("smarter-session-cookie-name") || "session_key";
const cookieDomain = rootElement.getAttribute("smarter-cookie-domain") || "localhost";
const authSessionCookieName = rootElement.getAttribute("django-session-cookie-name") || "sessionid";
const csrftoken = rootElement.getAttribute("django-csrftoken");
const debugMode = rootElement.getAttribute("smarter-debug-mode") === "true";
const debugCookieName = "debug";

function App() {
  return (
    <div className="App">
      <main>
        <SmarterChat
          apiUrl={apiUrl}
          toggleMetadata={toggleMetadata}
          csrfCookieName={csrfCookieName}
          csrftoken={csrftoken}
          debugCookieName={debugCookieName}
          debugMode={debugMode}
          sessionCookieName={sessionCookieName}
          authSessionCookieName={authSessionCookieName}
          showConsole={true}
          cookieDomain={cookieDomain}
        />
      </main>
    </div>
  );
}

export default App;
