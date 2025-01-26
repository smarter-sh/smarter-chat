/*-----------------------------------------------------------------------------
 Description: This file contains the function that makes the API request to
 the backend. It is called exclusively from chatApp/Component.jsx

 Notes:
  - The backend API is an AWS API Gateway endpoint that is configured to
    call an AWS Lambda function. The Lambda function is written in Python
    and calls the OpenAI API.

  - The backend API is configured to require an API key. The API key is
    passed in the header of the request. In real terms, the api key is
    pointless because it is exposed in the client code. However, it is
    required by the API Gateway configuration.

  - The backend API is configured to allow CORS requests from the client.
    This is necessary because the client and backend are served from
    different domains.

 Returns: the backend API is configured to return a JSON object that substantially
    conforms to the following structure for all 200 responses:
    v0.1.0 - v0.4.0:  ./test/events/openai.response.v0.4.0.json
    v0.5.0:       ./test/events/langchain.response.v0.5.0.json
-----------------------------------------------------------------------------*/
import { REACT_LOCAL_DEV_MODE } from "./constants.js";


export function getCookie(name, debug_mode = false) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        if (debug_mode) {
          console.log("getCookie(): found ", cookieValue, "for cookie", name);
        }
        break;
      }
    }
  }
  if (debug_mode && !cookieValue) {
    console.warn("getCookie(): no value found for", name);
  }
  return cookieValue;
}

export function setSessionCookie(
  session_key,
  debug_mode = false,
  sessionCookieName,
  sessionCookieExpiration,
) {
  const currentPath = window.location.pathname;
  if (session_key) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + sessionCookieExpiration);
    const expires = expirationDate.toUTCString();
    const cookieData = `${sessionCookieName}=${session_key}; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
    if (debug_mode) {
      console.log(
        "setSessionCookie(): ",
        cookieData,
        "now: ",
        new Date().toUTCString(),
        "expiration: ",
        expirationDate.toUTCString(),
      );
    }
  } else {
    // Unset the cookie by setting its expiration date to the past
    const expirationDate = new Date(0);
    const expires = expirationDate.toUTCString();
    const cookieData = `${sessionCookieName}=; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
    if (debug_mode) {
      console.log("setSessionCookie(): Unsetting cookie", cookieData);
    }
  }
}

export function setDebugCookie(
  debug_mode,
  debugCookieExpiration,
  debugCookieName,
) {
  debug_mode = debug_mode || false;
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + debugCookieExpiration);
  const expires = `expires=${expirationDate.toUTCString()}`;

  document.cookie = `${debugCookieName}=${debug_mode}; path=/; SameSite=Lax; ${expires}`;

  if (debug_mode) {
    console.log("setDebugCookie(): ", debug_mode);
  }
}

// api prompt request
function requestBodyFactory(messages, session_key) {
  const retval = {
    [sessionCookieName]: session_key,
    messages: messages,
  };
  return JSON.stringify(retval);
}

export async function processApiRequest(
  config,
  messages,
  api_url,
  openChatModal,
  csrfCookieName,
  sessionCookieName,
) {
  if (config.debug_mode) {
    console.log("processApiRequest(): config: ", config);
    console.log("processApiRequest(): api_url: ", api_url);
    console.log("processApiRequest(): messages: ", messages);
  }

  // Ensure that csrftoken is not included in the Cookie header.
  const cookiesArray = document.cookie.split(";").filter((cookie) => {
    const trimmedCookie = cookie.trim();
    return !trimmedCookie.startsWith(`${csrfCookieName}=`);
  });
  const cookies = cookiesArray.join("; ");
  const csrftoken = getCookie(csrfCookieName);

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRFToken": csrftoken,
    Origin: window.location.origin,
    Cookie: cookies,
  };
  const init = {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: headers,
    body: requestBodyFactory(messages, config.session_key),
  };
  if (config.debug_mode) {
    console.log("processApiRequest() - api_url:", api_url);
    console.log("processApiRequest() - init:", init);
    console.log("processApiRequest() - config:", config);
    console.log("processApiRequest(): cookiesArray: ", cookiesArray);
    console.log("processApiRequest(): cookies: ", cookies);
    console.log("processApiRequest(): csrftoken: ", csrftoken);
  }

  try {
    const response = await fetch(api_url, init);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const status = await response.status;
      const response_json = await response.json(); // Convert the ReadableStream to a JSON object
      const response_body = await response_json.data.body; // ditto

      if (config.debug_mode) {
        console.log("processApiRequest(): response status: ", status);
        console.log("processApiRequest(): response: ", response_json);
      }

      if (response.ok) {
        if (config.debug_mode) {
          console.log(
            "processApiRequest(): response_body: ",
            JSON.parse(response_body),
          );
        }
        return JSON.parse(response_body);
      } else {
        /*
          note:
          - the response_body object is not available when the status is 504, because
            these responses are generated exclusively by API Gateway.
          - the response_body object is potentially not available when the status is 500
            depending on whether the 500 response was generated by the Lambda or the API Gateway
          - the response_body object is intended to always be available when the status is 400.
            However, there potentially COULD be a case where the response itself contains message text.
        */
        console.error(
          "processApiRequest(): error: ",
          status,
          response.statusText,
          response_body.message,
        );

        let errTitle = "Error " + status;
        let errMessage =
          response.statusText ||
          response_body.message ||
          "The request was invalid.";

        console.error(errTitle, errMessage);
        openChatModal(errTitle, errMessage);
      }
    } else {
      const errorText = await response.text();
      throw new Error(`Unexpected response format: ${errorText}`);
    }
  } catch (error) {
    openChatModal("Error", error || "An unknown error occurred.");
    return;
  }
}

// api config request
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
