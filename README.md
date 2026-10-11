# @smarter.sh/ui-chat

> A drop-in React chat component for [Smarter](https://smarter.sh) LLMClients: streaming tool-call progress, GitHub
> flavored markdown, syntax-highlighted code, LaTeX math and Mermaid diagrams, out of the box.

[![npm version](https://img.shields.io/npm/v/@smarter.sh/ui-chat?logo=npm)](https://www.npmjs.com/package/@smarter.sh/ui-chat)
[![npm downloads](https://img.shields.io/npm/dm/@smarter.sh/ui-chat)](https://www.npmjs.com/package/@smarter.sh/ui-chat)
[![Test Status](https://github.com/smarter-sh/smarter-chat/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/smarter-sh/smarter-chat/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/codecov/c/github/smarter-sh/smarter-chat/main?label=coverage&logo=codecov)](https://codecov.io/gh/smarter-sh/smarter-chat)
[![TypeScript](https://img.shields.io/badge/types-included-blue?logo=typescript&logoColor=white)](#typescript)
[![React 19](https://img.shields.io/badge/react-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![License: AGPL-3.0-or-later](https://img.shields.io/npm/l/@smarter.sh/ui-chat)](https://github.com/smarter-sh/smarter-chat/blob/main/LICENSE)

![Smarter Chat](https://cdn.smarter.sh/images/smarter-chat-ui-example.png)

Smarter Chat is the chat UI of the Smarter web console's prompt engineering workbench, published as a React component
so that any web page can use a Smarter LLMClient as its chat backend: a marketing site, a customer portal, a storefront,
an intranet, or your own application.

**[Documentation](https://docs.smarter.sh/en/latest/smarter-framework/smarter-chat.html)** ·
**[Storybook](#development)** · **[Changelog](https://github.com/smarter-sh/smarter-chat/blob/main/CHANGELOG.md)** ·
**[Issues](https://github.com/smarter-sh/smarter-chat/issues)**

## Contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Requirements on the Smarter side](#requirements-on-the-smarter-side)
- [Props](#props)
- [Examples](#examples)
- [Styling](#styling)
- [TypeScript](#typescript)
- [How it works](#how-it-works)
- [Browser support](#browser-support)
- [Development](#development)
- [License](#license)

## Features

- **One component, one prop.** Give it the url of a deployed LLMClient, and it loads the LLMClient's name, welcome
  message, example prompts and placeholder from Smarter.
- **Persistent chat sessions.** The conversation survives page reloads, and each LLMClient on a site keeps its own
  session.
- **Live progress.** While a prompt runs, the chat shows each LLM request, tool, plugin and MCP server call, streamed
  as Server-Sent Events.
- **Rich responses.** GitHub flavored markdown (tables, lists, block quotes, images, links), syntax-highlighted code
  blocks with a copy button, LaTeX math typeset by [KaTeX](https://katex.org), and
  [Mermaid](https://mermaid.js.org) diagrams.
- **Safe by default.** Raw html is displayed as text, links and images are restricted to `http(s)`, relative and raster
  `data:` urls, and the rendered html and Mermaid's svg are sanitized with
  [DOMPurify](https://github.com/cure53/DOMPurify).
- **Lightweight where it counts.** React is a peer dependency, Mermaid is loaded only when a message first has a
  diagram, and KaTeX's fonts are downloaded only when an equation uses them.
- **Optional developer Console.** A resizable side panel with the LLMClient's configuration, the session's api calls,
  tool calls and plugin usage, and a live server log stream, as in the Smarter workbench.
- **Accessible.** Labeled regions and controls, keyboard-resizable panels, and MathML for screen readers.
- **Typed.** Written in TypeScript, with type declarations for its props and for the Smarter api's data.

## Installation

```console
npm install @smarter.sh/ui-chat
```

```console
yarn add @smarter.sh/ui-chat
```

```console
pnpm add @smarter.sh/ui-chat
```

`react` and `react-dom` 19 are peer dependencies. The package is published as ES and UMD bundles, and is meant to be
used with a bundler such as Vite, webpack, Rollup or Next.js.

## Quick start

```tsx
import { createRoot } from "react-dom/client";
import { SmarterChat } from "@smarter.sh/ui-chat";
import "@smarter.sh/ui-chat/dist/ui-chat.css";
import "katex/dist/katex.min.css"; // math in responses. katex is installed with the package.

createRoot(document.getElementById("chat")!).render(
  <div style={{ height: 600 }}>
    <SmarterChat
      apiUrl="https://stackademy.3141-5926-5359.api.example.com/"
      apiKey={import.meta.env.VITE_SMARTER_API_KEY} // only if the LLMClient has an api key
      showConsole={false}
    />
  </div>,
);
```

The chat fills the height of its parent element, so give the parent a height.

## Requirements on the Smarter side

The component talks directly to the Smarter platform from your visitors' browsers, so three things must be true:

1. **The LLMClient is deployed.** `apiUrl` is its url, for example
   `https://<name>.<account-number>.api.<your-smarter-domain>/`, or its verified custom domain. The chat calls that
   host only.
2. **Your page's origin is allowed.** Requests from your page are cross-origin, with credentials. List your origins in
   the LLMClient's manifest, and apply it:

   ```yaml
   spec:
     config:
       allowedOrigins:
         - https://www.example.com
         - http://localhost:5173
   ```

3. **The browser can authenticate, if the LLMClient requires it.** A deployed LLMClient without api keys is public:
   pass no `apiKey`, and every prompt is charged to the LLMClient's owner. For one with an api key, pass a Smarter api
   key as `apiKey`, which is sent as `Authorization: Token <apiKey>`. Anyone who can view your page can read it, so use
   a key dedicated to the page.

The page receives the LLMClient's public configuration (its name, welcome message, example prompts, model and system
prompt), never, for example, its owner's profile or the session's diagnostic histories.

See [Embedding Smarter Chat](https://docs.smarter.sh/en/latest/smarter-framework/smarter-chat/embedding.html) for
details, including troubleshooting.

## Props

Only `apiUrl` is required.

| Prop                      | Type             | Default         | Description                                                                                                                                                                                                       |
| ------------------------- | ---------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiUrl`                  | `string`         | (required)      | The LLMClient's api url. The chat appends `config/` to it for its configuration.                                                                                                                                  |
| `apiKey`                  | `string \| null` | `null`          | A Smarter api key, sent as `Authorization: Token <apiKey>`, for LLMClients that require authentication.                                                                                                           |
| `showConsole`             | `boolean`        | `true`          | Show the developer Console beside the chat. It needs a wide container; set it to `false` for end-user pages.                                                                                                      |
| `toggleMetadata`          | `boolean`        | `false`         | Show the Sandbox mode / Production mode button, which shows and hides the backend's own messages (system prompt, tool results, Smarter's), and start in sandbox mode. Without it, the chat is in production mode. |
| `streamProgress`          | `boolean`        | `true`          | Display a running prompt's progress, which the prompt api streams as Server-Sent Events.                                                                                                                          |
| `debugMode`               | `boolean`        | `false`         | Log to the browser console.                                                                                                                                                                                       |
| `cookieDomain`            | `string`         | `""`            | The domain whose cookies the chat reads. Empty means the page's own domain.                                                                                                                                       |
| `sessionCookieName`       | `string`         | `"session_key"` | The cookie in which the chat saves its session's key, for the page's path.                                                                                                                                        |
| `sessionCookieExpiration` | `number`         | one day         | The session cookie's lifetime, in milliseconds.                                                                                                                                                                   |
| `csrfCookieName`          | `string`         | `"csrftoken"`   | The name of Django's CSRF cookie, whose value is sent as the `X-CSRFToken` header.                                                                                                                                |
| `csrftoken`               | `string \| null` | `null`          | The CSRF token, when the page cannot read the CSRF cookie.                                                                                                                                                        |
| `debugCookieName`         | `string`         | `"debug"`       | The cookie in which the chat saves the LLMClient's debug mode.                                                                                                                                                    |
| `debugCookieExpiration`   | `number`         | one day         | The debug cookie's lifetime, in milliseconds.                                                                                                                                                                     |
| `smarterRequestId`        | `string`         | `""`            | A unique id of the page request, sent as the `X-Smarter-RequestId` header, for tracing.                                                                                                                           |
| `logStreamUrl`            | `string \| null` | `null`          | The url of a server log stream (Server-Sent Events), for the Console's Server Logs tab.                                                                                                                           |

## Examples

### A chat widget in a corner of the page

```tsx
function ChatWidget({ apiKey }: { apiKey: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(!open)}>Chat with us</button>
      {open && (
        <div style={{ position: "fixed", right: 24, bottom: 80, width: 400, height: 600 }}>
          <SmarterChat apiUrl="https://support.3141-5926-5359.api.example.com/" apiKey={apiKey} showConsole={false} />
        </div>
      )}
    </>
  );
}
```

### Next.js

The component uses browser apis (cookies, `localStorage`, `EventSource`), so render it on the client only:

```tsx
"use client";
import dynamic from "next/dynamic";
import "@smarter.sh/ui-chat/dist/ui-chat.css";
import "katex/dist/katex.min.css";

const SmarterChat = dynamic(() => import("@smarter.sh/ui-chat").then((m) => m.SmarterChat), { ssr: false });

export default function Chat() {
  return (
    <div style={{ height: "80vh" }}>
      <SmarterChat
        apiUrl="https://stackademy.3141-5926-5359.api.example.com/"
        apiKey={process.env.NEXT_PUBLIC_SMARTER_API_KEY}
        showConsole={false}
      />
    </div>
  );
}
```

### A prompt engineering workbench

The full workbench, as in the Smarter web console: the Console, the mode toggle, and your server logs.

```tsx
<SmarterChat
  apiUrl={apiUrl}
  apiKey={apiKey}
  toggleMetadata
  showConsole
  logStreamUrl="https://platform.example.com/dashboard/logs/api/stream/"
/>
```

## Styling

Import the stylesheet once, anywhere in your app:

```ts
import "@smarter.sh/ui-chat/dist/ui-chat.css"; // or "@smarter.sh/ui-chat/style.css"
import "katex/dist/katex.min.css";
```

- **`ui-chat.css`** is the component's own css, including
  [chatscope](https://github.com/chatscope/chat-ui-kit-react)'s chat styles, which it is built on.
- **`katex/dist/katex.min.css`** is the stylesheet of math in responses. It's left out of `ui-chat.css` so that pages
  without math don't pay for KaTeX's fonts. Without it, math is displayed twice: as text, and as unstyled MathML.

The component's elements have stable class names, prefixed `smarter-chat-` (for example `.smarter-chat-message-list`,
`.smarter-chat-code`, `.smarter-chat-image`), under a root `.SmarterChat` element, so you can override their styles
from your own stylesheet.

## TypeScript

Type declarations are included. Besides the components, the package exports:

| Export                                                                         | What it is                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `SmarterChat`                                                                  | The chat component.                                              |
| `Console`                                                                      | The developer Console, on its own.                               |
| `SmarterChatProps`                                                             | The chat's props.                                                |
| `ChatConfig`, `LLMClientConfig`, `ChatHistory`, `ChatMetaData`                 | The LLMClient configuration that the Smarter config api returns. |
| `Contract`                                                                     | Every type of the api contract, generated from its JSON Schema.  |
| `normalizeConfig`, `CHAT_CONTRACT_V2_CAPABILITY`                               | Converts an older platform's configuration to the current one.   |
| `ApiMessage`, `ChatMessage`                                                    | A message as the api sends it, and as the chat thread holds it.  |
| `PromptProgressEvent`                                                          | A step of a running prompt, as the prompt api streams it.        |
| `MessageDirectionEnum`, `SenderRoleEnum`, `ValidMessageRolesEnum`, `MenuItems` | Message directions and roles, and the Console's tabs.            |
| `version`                                                                      | The package's version.                                           |

## How it works

The component makes two kinds of POST requests to Smarter, with the browser's cookies:

1. **`<apiUrl>config/`** returns the LLMClient's configuration and the chat session's history, which restores the
   thread when the page reloads. A new session's key is saved in a cookie.
2. **The LLMClient's prompt api** (`llmclient.url_llmclient` in the configuration) receives the thread with each new
   message, and returns the messages to add to it. With `streamProgress`, it answers with Server-Sent Events: progress
   events while the prompt runs, then the result.

The api contract is versioned, and generated from the backend's Pydantic models: the component asks for the current
version, with `X-Smarter-Capabilities: chat-contract-v2`, and reads the previous one from older Smarter platforms.

The complete contract, with every request, response, header, cookie and event, is in
[The Chat API Contract](https://docs.smarter.sh/en/latest/smarter-framework/smarter-chat/api-contract.html).

## Browser support

Current versions of Chrome, Edge, Firefox and Safari. The component uses `fetch` response streams, `EventSource`,
`localStorage` and the `inert` attribute.

## Development

```console
git clone https://github.com/smarter-sh/smarter-chat.git
cd smarter-chat
make init    # npm install
make serve   # Storybook at http://localhost:6006, with the Smarter api mocked
make test    # Vitest; every story is also rendered as a test
```

No Smarter backend is needed: the stories mock the api with [MSW](https://mswjs.io/). See
[CONTRIBUTING.md](https://github.com/smarter-sh/smarter-chat/blob/main/.github/CONTRIBUTING.md) for the rest of the
workflow (every `make` target, working inside the Smarter repository, commits and releases), and the
[developer guide](https://docs.smarter.sh/en/latest/smarter-framework/smarter-chat/development.html) for the
architecture.

## License

[AGPL-3.0-or-later](https://github.com/smarter-sh/smarter-chat/blob/main/LICENSE), as Smarter is. Copyright © Lawrence
McDaniel.

Contributions are welcome: code, documentation, how-to videos, testing and community help. See
[CONTRIBUTING.md](https://github.com/smarter-sh/smarter-chat/blob/main/.github/CONTRIBUTING.md), or contact
[Lawrence McDaniel](https://lawrencemcdaniel.com/contact).
