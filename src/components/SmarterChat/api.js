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

import { getCookie, setCookie } from "../shared/cookie";

// Set to true to enable local development mode,
// which will simulate the server-side API calls.
const developerMode = false;
let debugMode = developerMode;
const userAgent = "SmarterChat/1.0";
const applicationJson = "application/json";

function promptRequestBodyFactory(messages, config) {
  const body = {
    session_key: config.session_key,
    messages: messages,
  };
  return JSON.stringify(body);
}

function requestHeadersFactory(cookies) {
  if (debugMode) {
    console.log("requestHeadersFactory(): cookies", cookies);
  }
  function getRequestCookies(cookies) {
    // Ensure that csrftoken is not included in the Cookie header.
    const cookiesArray = document.cookie.split(";").filter((cookie) => {
      const trimmedCookie = cookie.trim();
      return !trimmedCookie.startsWith(`${cookies.csrfCookie.name}=`);
    });
    const selectedCookies = cookiesArray.join("; ");

    // example return value: "_ga=GA1.1.1244182935.1742308279;  _ga_SK81M5HQYS=GS1.1.1742316653.3.1.1742320251.0.0.0"
    return selectedCookies;
  }

  const requestCookies = getRequestCookies(cookies);
  const csrftoken = getCookie(cookies.csrfCookie, "");
  const authToken = getCookie(cookies.authTokenCookie, "");

  const requestHeaders = {
    Accept: applicationJson,
    "Content-Type": applicationJson,
    "X-CSRFToken": csrftoken,
    Origin: window.location.origin,
    Cookie: requestCookies,
    Authorization: `Bearer ${authToken}`,
    "User-Agent": userAgent,
  };
  if (debugMode) {
    console.log("requestHeadersFactory(): requestHeaders", requestHeaders);
  }
  return requestHeaders;
}

function requestInitFactory(headers, body) {
  return {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: headers,
    body: body,
  };
}

function urlFactory(apiUrl, endpoint, sessionKey) {
  if (!apiUrl.endsWith("/")) {
    apiUrl += "/";
  }
  endpoint = endpoint || "";
  let apiConfigUrl = new URL(endpoint, apiUrl);
  if (sessionKey) {
    apiConfigUrl.searchParams.append("session_key", sessionKey);
  }
  const url = apiConfigUrl.toString();
  return url;
}

async function getJsonResponse(url, init, cookies) {
  try {
    if (debugMode) {
      console.log("getJsonResponse(): url: ", url, ", init: ", init, ", cookies: ", cookies);
    }
    const response = await fetch(url, init);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes(applicationJson)) {
      const status = await response.status;
      if (response.ok) {
        const responseJson = await response.json(); // Convert the ReadableStream to a JSON object
        const responseJsonData = await responseJson.data; // ditto
        if (debugMode) {
          console.log("getJsonResponse(): response: ", responseJson);
        }
        return responseJsonData;
      } else {
        /*
          note:
          - the responseBody object is not available when the status is 504, because
            these responses are generated exclusively by API Gateway.
          - the responseBody object is potentially not available when the status is 500
            depending on whether the 500 response was generated by the Lambda or the API Gateway
          - the responseBody object is intended to always be available when the status is 400.
            However, there potentially COULD be a case where the response itself contains message text.
        */
        console.error("getJsonResponse(): error: ", status, response.statusText);
        return response;
      }
    } else {
      const errorText = await response.text();
      throw new Error(`getJsonResponse() Unexpected response format: ${errorText}`);
    }
  } catch (error) {
    return error;
  }
}

export async function fetchPrompt(config, messages, cookies) {
  debugMode = config.debug_mode || developerMode;

  if (debugMode) {
    console.log("fetchPrompt(): config", config);
  }
  const apiUrl = config.chatbot.url_chatbot;
  const sessionKey = getCookie(cookies.sessionCookie, "");
  const url = urlFactory(apiUrl, null, sessionKey);
  const headers = requestHeadersFactory(cookies);
  const body = promptRequestBodyFactory(messages, config);
  const init = requestInitFactory(headers, body);
  const responseJson = await getJsonResponse(url, init, cookies);
  if (responseJson && responseJson.body) {
    if (debugMode) {
      console.log("fetchPrompt(): parsing responseJson.body ");
    }
    const responseBody = await JSON.parse(responseJson.body);
    return responseBody;
  }
  return null;
}

async function fetchLocalConfig(configFile) {
  const response = await fetch("../data/" + configFile);
  const sampleConfig = await response.json();
  return sampleConfig.data;
}

export async function fetchConfig(apiUrl, cookies) {
  /*
  Fetch the chat configuration from the backend server. This is a POST request with the
  session key as the payload. The server will return the configuration
  as a JSON object.

  See class ChatConfigView(View, AccountMixin) in
  https://github.com/smarter-sh/smarter/blob/main/smarter/smarter/apps/chatapp/views.py
  Things to note:
  - The session key is used to identify the user, the chatbot,
    and the chat history.
  - The session key is stored in a cookie that is specific to the path. Thus,
    each chatbot has its own session key.
  - The CSRF token is stored in a cookie and is managed by Django.
  - debugMode is a boolean that is also stored in a cookie, managed by Django
    based on a Waffle switch 'reactapp_debug_mode'
  */
  if (developerMode) {
    return fetchLocalConfig("sample-config.json");
  }
  const sessionKey = getCookie(cookies.sessionCookie, "");
  const headers = requestHeadersFactory(cookies);
  const body = JSON.stringify({ session_key: sessionKey });
  const init = requestInitFactory(headers, body);
  const url = urlFactory(apiUrl, "config/", sessionKey);
  const newConfig = await getJsonResponse(url, init, cookies);
  if (newConfig) {
    setCookie(cookies.sessionCookie, newConfig.session_key);
    setCookie(cookies.debugCookie, newConfig.debug_mode);
    debugMode = newConfig.debug_mode || developerMode;
    return newConfig;
  }
  return null;
}
