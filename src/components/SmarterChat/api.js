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

// Set to true to enable local development mode,
// which will simulate the server-side API calls.
const developerMode = false;

function getCookie(cookie, defaultValue = null) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const thisCookie = cookies[i].trim();
      if (thisCookie.substring(0, cookie.name.length + 1) === cookie.name + "=") {
        cookieValue = decodeURIComponent(thisCookie.substring(cookie.name.length + 1));
        if (developerMode) {
          console.log("getCookie(): found ", cookieValue, "for cookie", cookie.name);
        }
        break;
      }
    }
  }
  if (developerMode && !cookieValue) {
    console.warn("getCookie(): no value found for", cookie.name);
  }
  return cookieValue || defaultValue;
}

function setCookie(cookie) {
  const currentPath = window.location.pathname;
  if (cookie.value) {
    const expirationDate = new Date();
    expirationDate.setTime(expirationDate.getTime() + cookie.expiration);
    const expires = expirationDate.toUTCString();
    const cookieData = `${cookie.name}=${cookie.value}; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
    if (developerMode) {
      console.log(
        "setCookie(): ",
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
    const cookieData = `${cookie.name}=; path=${currentPath}; SameSite=Lax; expires=${expires}`;
    document.cookie = cookieData;
    if (developerMode) {
      console.log("setCookie(): Unsetting cookie", cookieData);
    }
  }
}

// api prompt request
function promptRequestBodyFactory(messages, sessionCookieName, sessionKey) {
  const body = {
    [sessionCookieName]: sessionKey,
    messages: messages,
  };
  return JSON.stringify(body);
}

function requestHeadersFactory(cookies) {
  function getRequestCookies(cookies) {
    // Ensure that csrftoken is not included in the Cookie header.
    const cookiesArray = document.cookie.split(";").filter((cookie) => {
      const trimmedCookie = cookie.trim();
      return !trimmedCookie.startsWith(`${cookies.csrfCookie.name}=`);
    });
    const selectedCookies = cookiesArray.join("; ");
    return selectedCookies;
  }

  const userAgent = "SmarterChat/1.0";
  const applicationJson = "application/json";
  const requestCookies = getRequestCookies(cookies);
  const csrftoken = getCookie(cookies.csrfCookie.name, "");
  const authToken = null; // FIX NOTE: add me.

  return {
    "Accept": applicationJson,
    "Content-Type": applicationJson,
    "X-CSRFToken": csrftoken,
    "Origin": window.location.origin,
    "Cookie": requestCookies,
    "Authorization": `Bearer ${authToken}`,
    "User-Agent": userAgent,
  };
}

export async function fetchPrompt(
  config,
  messages,
  apiUrl,
  openErrorModal,
  cookies,
) {
  if (config.debug_mode) {
    console.log("fetchPrompt(): config: ", config);
    console.log("fetchPrompt(): apiUrl: ", apiUrl);
    console.log("fetchPrompt(): messages: ", messages);
  }

  const init = {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: requestHeadersFactory(cookies),
    body: promptRequestBodyFactory(messages, cookies.sessionCookie.name, config.session_key),
  };
  if (config.debug_mode) {
    console.log("fetchPrompt() - apiUrl:", apiUrl);
    console.log("fetchPrompt() - init:", init);
    console.log("fetchPrompt() - config:", config);
    console.log("fetchPrompt(): cookiesArray: ", cookiesArray);
    console.log("fetchPrompt(): cookies: ", cookies);
  }

  try {
    const response = await fetch(apiUrl, init);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const status = await response.status;
      const responseJson = await response.json(); // Convert the ReadableStream to a JSON object
      const responseBody = await responseJson.data.body; // ditto

      if (config.debug_mode) {
        console.log("fetchPrompt(): response status: ", status);
        console.log("fetchPrompt(): response: ", responseJson);
      }

      if (response.ok) {
        if (config.debug_mode) {
          console.log(
            "fetchPrompt(): responseBody: ",
            JSON.parse(responseBody),
          );
        }
        return JSON.parse(responseBody);
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
        console.error(
          "fetchPrompt(): error: ",
          status,
          response.statusText,
          responseBody.message,
        );

        let errTitle = "Error " + status;
        let errMessage =
          response.statusText ||
          responseBody.message ||
          "The request was invalid.";

        console.error(errTitle, errMessage);
        openErrorModal(errTitle, errMessage);
      }
    } else {
      const errorText = await response.text();
      throw new Error(`Unexpected response format: ${errorText}`);
    }
  } catch (error) {
    openErrorModal("Error", error || "An unknown error occurred.");
    return;
  }
}

// api config request
async function fetchLocalConfig(configFile) {
  const response = await fetch("../data/" + configFile);
  const sampleConfig = await response.json();
  return sampleConfig.data;
}

export async function fetchConfig(
  configUrl,
  cookies,
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
  - debugMode is a boolean that is also stored in a cookie, managed by Django
    based on a Waffle switch 'reactapp_debug_mode'
  */
  const sessionKey = getCookie(cookies.sessionCookie, "");
  const debugMode = getCookie(cookies.debugCookie) === "true";
  const requestBody = {
    [cookies.sessionCookie.name]: sessionKey,
  };
  const init = {
    method: "POST",
    mode: "cors",
    headers: requestHeadersFactory(cookies),
    body: JSON.stringify(requestBody),
  };

  try {
    if (developerMode) {
      return fetchLocalConfig("sample-config.json");
    }
    let thisURL = new URL(configUrl);
    if (sessionKey) {
      thisURL.searchParams.append(cookies.sessionCookie.name, sessionKey);
    }
    let configURL = thisURL.toString();

    if (debugMode) {
      console.log("fetchConfig() - init: ", init);
      console.log("fetchConfig() - configURL: ", configURL);
    }

    const response = await fetch(configURL, init);
    const responseJson = await response.json(); // Convert the ReadableStream to a JSON object

    if (debugMode) {
      console.log("fetchConfig() - responseJson: ", responseJson);
    }
    if (response.ok) {
      const newConfig = responseJson.data;
      setCookie(cookies.sessionCookie);
      setCookie(cookies.debugCookie);
      return newConfig;
    }
  } catch (error) {
    console.error("fetchConfig() error", error);
    return fetchLocalConfig("error-config.json");
  }
}
