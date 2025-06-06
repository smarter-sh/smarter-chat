[![NPM](https://a11ybadges.com/badge?logo=npm)](https://www.npmjs.com/package/@smarter.sh/ui-chat)
[![GitHub](https://a11ybadges.com/badge?logo=github)](https://github.com/smarter-sh/smarter-chat/)
<a href="https://smarter.sh">
<img src="https://img.shields.io/badge/Smarter.sh-orange?style=flat&logo=appveyor&logoColor=white" height="32">
</a>

# SmarterChat React.js component for smarter.sh

This project contains the source code for the interactive chatbot found in the Smarter web console [developer workbench](https://platform.smarter.sh/chatbots/example/). It integrates natively with Smarter Saas and on-premise installations. You can optionally enable the meta data output behavior found in the Smarter sandbox. See [Smarter Technical Overview](./doc/README.md)

This project is also suitable for all front-end cross-platform projects. For example, use this code base to create a react.js run-time for use inside of Wordpress plugins, salesforce.com apps, .net components and Sharepoint add-ins.

![Basic Usage](./doc/img/readme-usage4.png)

## Usage

```console
npm install @smarter.sh/ui-chat
```

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { SmarterChat } from "@smarter.sh/ui-chat";

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
const apiUrl = rootElement.getAttribute("smarter-chatbot-api-url");
const toggleMetadata = rootElement.getAttribute("smarter-toggle-metadata") === "true";
const csrfCookieName = rootElement.getAttribute("smarter-csrf-cookie-name") || "csrftoken";
const sessionCookieName = rootElement.getAttribute("smarter-session-cookie-name") || "session_key";
const cookieDomain = rootElement.getAttribute("smarter-cookie-domain") || "platform.smarter.sh";
const authSessionCookieName = rootElement.getAttribute("django-session-cookie-name") || "sessionid";
const csrftoken = rootElement.getAttribute("django-csrftoken");
const debugMode = rootElement.getAttribute("smarter-debug-mode") === "true";
const debugCookieName = "debug";

root.render(
  <React.StrictMode>
    <SmarterChat
      apiUrl={apiUrl}
      apiKey={apiKey}
      toggleMetadata={toggleMetadata}
      csrfCookieName={csrfCookieName}
      csrftoken={csrftoken}
      debugCookieName={debugCookieName}
      debugCookieExpiration={debugCookieExpiration}
      debugMode={debugMode}
      sessionCookieName={sessionCookieName}
      sessionCookieExpiration={sessionCookieExpiration}
      authSessionCookieName={authSessionCookieName}
      showConsole={true}
      cookieDomain={cookieDomain}
    />
  </React.StrictMode>,
);
```

## Integrate to an existing web page

We integrate this react component to the [Smarter developer workbench](https://platform.smarter.sh/) using this small repo, [github.com/smarter-sh/smarter-workbench](https://github.com/smarter-sh/smarter-workbench). This methodology provides a layer of separation between Django and react.js, which keeps things simple. smarter-workbench substantially consists of the following three files:

- [main.jsx](https://github.com/smarter-sh/smarter-workbench/blob/main/src/main.jsx): a 40-line react.js mini app for configuring this npm component with a Smarter Api url and any initialization settings we choose to include.
- [app-loader.js](https://github.com/smarter-sh/smarter-workbench/blob/main/src/public/app-loader.js): a small js script that injects the react.js build assets into your DOM, initiating the React boot-up process.
- [Makefile](https://github.com/smarter-sh/smarter-workbench/blob/main/Makefile): for automating build and release to AWS Cloudfront, where the react ui-chat app is served.

Meanwhile, Django adds a pair of DOM elements like the following example, where app-loader.js launches itself with an "iffe", (Immediately Invoked Function Expression).

```html
<div
  id="smarter-sh-v1-ui-chat-root"
  smarter-chatbot-api-url="https://openai.3141-5926-5359.api.smarter.sh/"
  smarter-toggle-metadata="False"
  style="height: 88vh;"
></div>
<script async="" src="https://cdn.platform.smarter.sh/ui-chat/app-loader.js"></script>
```

## Developers

SmarterChat is created with [React](https://react.dev/) leveraging [@chatscope/chat-ui-kit-react](https://www.npmjs.com/package/@chatscope/chat-ui-kit-react)

### Backend integration

See [Getting Started with the Smarter Chatbot Api](./doc/CHATBOT_API.md)
This app interacts with two endpoints from the [smarter.sh/v1](https://platform.smarter.sh/docs/api/) chatbot api:

- GET `/config/`: retrieves a json dict, structured in 4 major sections, with all information required by the react app.
- POST `/chat/`: send a text completion prompt to the Smarter Api.

Smarter chatbot urls use either of these two naming conventions:

- public: `https://<name>.<account_number>.example.com/`
- authenticated: `https://platform.smarter.sh/chatbots/<name>/`. This react component looks for and adds the Smarter platform sessionid cookie value to request headers, if it exists.

Public api url example for a deployed chatbot:

- `https://my-chatbot.3141-5926-5359.api.smarter.sh/config/`
- `https://my-chatbot.3141-5926-5359.api.smarter.sh/chat/`

Authenticated api url example for any chatbot in your Smarter account:

- `https://platform.smarter.sh/chatbots/my-chatbot/config/`
- `https://platform.smarter.sh/chatbots/my-chatbot/chat/`

#### Config

A Json dict containing all configuration data for the chatbot. This is downloaded at run-time when the reactapp is initializing.
Example: [/chatbots/example/config/?session_key=YOUR-SESSION-KEY](http://localhost:8000/chatbots/example/config/)

See: [sample config](./data/sample-config.json)

#### Api

A REST Api for sending and receiving chat prompt requests. The url comes from the config dict (above): data.chatbot.url_chatbot.
example: `http://api.smarter.sh/v1/chatbots/smarter/example/`

example http request:

```json
{
    "method": "POST",
    "credentials": "include",
    "mode": "cors",
    "headers": {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-CSRFToken": "q9WXqqIhYJMI3ZSBIOE18JMORBMqAHri",
        "Origin": "http://localhost:8000",
        "Cookie": "session_key=a07593ecfaecd24008ca4251096732663ac0213b8cc6bdcce4f4c043276ab0b5; debug=true;"
    },
    "body": "{\"session_key\":\"a07593ecfaecd24008ca4251096732663ac0213b8cc6bdcce4f4c043276ab0b5\",\"messages\":[{\"role\":\"system\",\"content\":\"You are a helpful chatbot."},{\"role\":\"assistant\",\"content\":\"Welcome to the Smarter demo!\"}]}"
}
```

example http response:

```json
{
  "data": {
    "isBase64Encoded": false,
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"id\": \"chatcmpl-AoDpMvoAhf8iSJuEm6pMqkX62HK4G\", \"choices\": [{\"finish_reason\": \"stop\", \"index\": 0, \"logprobs\": null, \"message\": {\"content\": \"Hello! While I'm not your mom, I'm here to help you with any questions or tasks you have. What can I assist you with today?\", \"refusal\": null, \"role\": \"assistant\", \"audio\": null, \"function_call\": null, \"tool_calls\": null}}], \"created\": 1736532916, \"model\": \"gpt-4-turbo-2024-04-09\", \"object\": \"chat.completion\", \"service_tier\": \"default\", \"system_fingerprint\": \"fp_f17929ee92\", \"usage\": {\"completion_tokens\": 33, \"prompt_tokens\": 1122, \"total_tokens\": 1155, \"completion_tokens_details\": {\"accepted_prediction_tokens\": 0, \"audio_tokens\": 0, \"reasoning_tokens\": 0, \"rejected_prediction_tokens\": 0}, \"prompt_tokens_details\": {\"audio_tokens\": 0, \"cached_tokens\": 0}}, \"metadata\": {\"tool_calls\": null, \"model\": \"gpt-4-turbo\", \"temperature\": 0.5, \"max_tokens\": 256, \"input_text\": \"hi mom\"}}"
  },
  "api": "smarter.sh/v1",
  "thing": "Chatbot",
  "metadata": {
    "command": "chat"
  }
}
```

## Contributor Reference

### Getting Started

- `make`: prints a full menu of commands to the console.
- `make init`: Setup your environment for first time use. sets up your Node environment for you. initializes pre-commit, which you need to run prior to creating pull requests.
- `make run`: Run the dev server locally
- `make build`: Build the react.js project. saves vite.js output to `./build` in the root of this project.
- `make release`: Deploy the react.js project. **REQUIRES awscli + keypair with sufficient permissions**. Publishes the contents of the `./build` folder to an AWS S3 bucket served by the host defined by the value of `CDN_HOST_BASE_URL` located in shared/constant.js. For example, the react app for the Smarter workbench is initialized and served from these endpoints: a. [index.html](https://cdn.platform.smarter.sh/ui-chat/index.html): the react app build artifacts, and b. [app-loader.js](https://cdn.platform.smarter.sh/ui-chat/app-loader.js): a script to insert the react app build artifacts into the DOM.

### Architecture

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Chat UI Kit React](https://www.npmjs.com/package/@chatscope/chat-ui-kit-react)

## Contributing

We welcome contributions! There are a variety of ways for you to get involved, regardless of your background. In addition to Pull requests, this project would benefit from contributors focused on documentation and how-to video content creation, testing, community engagement, and stewards to help us to ensure that we comply with evolving standards for the ethical use of AI.

You can also contact [Lawrence McDaniel](https://lawrencemcdaniel.com/contact) directly.
