[![NPM](https://a11ybadges.com/badge?logo=npm)](https://www.npmjs.com/package/@smarter.sh/ui-chat)
[![GitHub](https://a11ybadges.com/badge?logo=github)](https://github.com/smarter-sh/smarter-chat/)
<a href="https://smarter.sh">
<img src="https://img.shields.io/badge/Smarter.sh-orange?style=flat&logo=appveyor&logoColor=white" height="32">
</a>

# Smarter Chat

Smarter Chat is the React chat component of the [Smarter](https://smarter.sh) LLMClient prompt engineering
workbench. Beside the chat, its Console displays the LLMClient's configuration, and the chat session's api calls,
tool calls and plugin usage. A toggle shows and hides the backend's own messages in the chat thread, and a failed
prompt is displayed in the thread with the LLM provider's error message.

It is also published to npm as [@smarter.sh/ui-chat](https://www.npmjs.com/package/@smarter.sh/ui-chat), so that
any web page can use a Smarter LLMClient as its chat backend: a Wordpress or Squarespace site, a Salesforce portal,
a Shopify storefront, a Sharepoint add-in, or your own web application.

![Basic Usage](./doc/img/readme-usage4.png)

See the [Smarter Chat documentation](https://docs.smarter.sh/en/latest/smarter-framework/developer-reference/react-integration/smarter-chat.html).

## Usage

```console
npm install @smarter.sh/ui-chat
```

```tsx
import { createRoot } from "react-dom/client";
import { SmarterChat } from "@smarter.sh/ui-chat";
import "@smarter.sh/ui-chat/dist/ui-chat.css";

createRoot(document.getElementById("chat")!).render(
  <SmarterChat
    apiUrl="https://stackademy.3141-5926-5359.api.example.com/"
    cookieDomain="example.com"
    showConsole={false}
  />,
);
```

React 19 is a peer dependency.

### Props

| Prop                      | Default         | Description                                                                                             |
| ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `apiUrl`                  | (required)      | The url of the LLMClient's api. The chat appends `config/` for its configuration.                       |
| `apiKey`                  | `null`          | A Smarter api key, sent as `Authorization: Token <apiKey>`, for LLMClients that require authentication. |
| `toggleMetadata`          | `false`         | Show the button that shows and hides the backend's messages (system prompt, tool results, Smarter's).   |
| `showConsole`             | `true`          | Show the Console beside the chat. It needs a wide page.                                                 |
| `debugMode`               | `false`         | Log to the browser console.                                                                             |
| `csrfCookieName`          | `"csrftoken"`   | The name of Django's CSRF cookie, whose value is sent as the `X-CSRFToken` header.                      |
| `csrftoken`               | `null`          | The CSRF token, when the page cannot read the CSRF cookie.                                              |
| `sessionCookieName`       | `"session_key"` | The cookie in which the chat saves its chat session's key, for the page's path.                         |
| `sessionCookieExpiration` | one day         | The session cookie's lifetime, in milliseconds.                                                         |
| `debugCookieName`         | `"debug"`       | The cookie in which the chat saves the LLMClient's debug mode.                                          |
| `debugCookieExpiration`   | one day         | The debug cookie's lifetime, in milliseconds.                                                           |
| `cookieDomain`            | `""`            | The domain whose cookies the chat reads. Empty means the page's own domain.                             |
| `smarterRequestId`        | `""`            | A unique id of the page request, sent as the `X-Smarter-RequestId` header.                              |

The package also exports the `Console` component, the `MessageDirectionEnum`, `SenderRoleEnum`,
`ValidMessageRolesEnum` and `MenuItems` enums, `version`, and TypeScript types for its props and for the
Smarter api's data (`SmarterChatProps`, `ChatConfig`, `ChatMessage`, ...).

### The Smarter api

Smarter Chat calls two apis, both with POST requests that send the browser's cookies:

- `<apiUrl>config/?session_key=<key>`: the LLMClient's configuration, including the chat session's history,
  which restores the chat thread when the page reloads. A new chat session's key is saved in the session cookie.
- `chatbot.url_chatbot` in the configuration: the LLMClient's prompt api. It receives the chat thread with each
  new message, `{"session_key": "...", "messages": [...]}`, and returns the completion as a JSON string, in
  `data.body`, whose `smarter.messages` are added to the thread. A failed prompt returns the LLM provider's status,
  and `{"error": {"status", "message"}, "response": <the completion>}` in its body.

Requests from your page to the Smarter api are cross-origin, so your page's origin must be allowed by the Smarter
platform's CORS configuration.

## Development

Smarter Chat is developed inside the npm workspace of the
[Smarter repository](https://github.com/smarter-sh/smarter), whose web console hosts it as one of its React apps,
and whose TypeScript, Vite, Vitest, Storybook, ESLint and Prettier configuration it shares. `make react-install`,
in the Smarter repository, clones this repository into `smarter/react/packages/smarter-chat`:

```console
git clone https://github.com/smarter-sh/smarter.git
cd smarter
make react-install                            # clones smarter-chat's main branch
make react-install SMARTER_CHAT_BRANCH=alpha  # or another branch
```

Then, in `smarter/react/packages/smarter-chat`, which is this repository's own git working tree:

| Command             | What it does                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Runs the app with Vite's dev server, proxying api requests to the Smarter dev server (port 9357). |
| `npm run storybook` | Browses the components in Storybook, with the Smarter api mocked by MSW.                          |
| `npm test`          | Runs the unit tests (Vitest and React Testing Library). Every story is also rendered as a test.   |
| `npm run lint`      | Lints with the workspace's ESLint configuration.                                                  |
| `npm run typecheck` | Type-checks with TypeScript.                                                                      |
| `npm run build`     | Builds the app into the Smarter web console's static files, with a Vite manifest for Django.      |
| `npm run build:lib` | Builds the npm package into `dist/`: ES and UMD bundles, `ui-chat.css`, and type declarations.    |
| `npm publish`       | Builds the npm package, then publishes it.                                                        |

The Smarter repository's `make react-test` and `make react-lint`, and its GitHub Actions workflows, test and lint
Smarter Chat along with the other React apps.

### Source

| Path                          | Contents                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| `src/index.ts`                | The npm package's public api.                                                              |
| `src/main.tsx`, `src/App.tsx` | The app that the Smarter web console renders, configured by its root element's attributes. |
| `src/components/`             | `SmarterChat`, `Console`, `AppTitle` and `ErrorBoundary`, with their stories and tests.    |
| `src/lib/`                    | The Smarter api calls, the chat thread's messages, and cookies.                            |
| `src/mocks/`                  | Example api data and MSW handlers, for the stories and tests.                              |

## Contributing

We welcome contributions! There are a variety of ways for you to get involved, regardless of your background. In
addition to Pull requests, this project would benefit from contributors focused on documentation and how-to video
content creation, testing, community engagement, and stewards to help us to ensure that we comply with evolving
standards for the ethical use of AI.

You can also contact [Lawrence McDaniel](https://lawrencemcdaniel.com/contact) directly.
