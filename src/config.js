// API_KEY access is scaffolded, but in point of fact it's not really
// necessary for this application since Terraform also creates an
// AWS API Gateway 'Usage Plan' that limits access to the API.
//
// The API_KEY is only used to demonstrate how you'd set this up in
// the event that you needed it.
import { getCookie, setSessionCookie, setDebugCookie } from "./cookies.js";
import { REACT_LOCAL_DEV_MODE } from "./constants.js";

async function fetchLocalConfig(config_file) {
  const response = await fetch("../data/" + config_file);
  const sampleConfig = await response.json();
  return sampleConfig.data;
}

export async function fetchConfig(
  configUrl,
  csrfCookieName,
  sessionCookieName,
  sessionCookieExpiration,
  debugCookieName,
  debugCookieExpiration,
) {
  /*
  Fetch the chat configuration from the backend server. This is a POST request with the
  session key as the payload. The server will return the configuration
  as a JSON object.

  See class ChatConfigView(View, AccountMixin) in smarter/smarter/apps/chatapp/views.py.
  Things to note:
  - The session key is used to identify the user, the chatbot,
    and the chat history.
  - The session key is stored in a cookie that is specific to the path. Thus,
    each chatbot has its own session key.
  - The CSRF token is stored in a cookie and is managed by Django.
  - debug_mode is a boolean that is also stored in a cookie, managed by Django
    based on a Waffle switch 'reactapp_debug_mode'
  */
  const session_key = getCookie(sessionCookieName) || "";
  const csrftoken = getCookie(csrfCookieName);
  const debug_mode = getCookie(debugCookieName) === "true";

  console.log("debug_mode:", debug_mode);

  const headers = {
    Accept: "*/*",
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken,
    Origin: window.location.origin,
  };
  const body = {
    sessionCookieName: session_key,
  };
  const init = {
    method: "POST",
    mode: "cors",
    headers: headers,
    body: JSON.stringify(body),
  };

  try {
    if (REACT_LOCAL_DEV_MODE) {
      return fetchLocalConfig("sample-config.json");
    }
    let thisURL = new URL(configUrl);
    if (session_key) {
      thisURL.searchParams.append(sessionCookieName, session_key);
    }
    let configURL = thisURL.toString();

    if (debug_mode) {
      console.log("fetchConfig() - init: ", init);
      console.log("fetchConfig() - configURL: ", configURL);
    }

    const response = await fetch(configURL, init);
    const response_json = await response.json(); // Convert the ReadableStream to a JSON object

    if (debug_mode) {
      console.log("fetchConfig() - response_json: ", response_json);
    }
    if (response.ok) {
      const newConfig = response_json.data;
      setSessionCookie(
        config.session_key,
        config.debug_mode,
        sessionCookieName,
        sessionCookieExpiration,
      );
      setDebugCookie(config.debug_mode, debugCookieExpiration, debugCookieName);
      return newConfig;
    }
  } catch (error) {
    console.error("fetchConfig() error", error);
    return fetchLocalConfig("error-config.json");
  }
}
