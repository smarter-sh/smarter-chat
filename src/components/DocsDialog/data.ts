/** A technical reference that the Docs dialog links to. */
export interface DocLink {
  title: string;
  url: string;
  description: string;
}

/**
 * The technical references for prompt engineers, who build LLMClients in the sandbox, and for
 * software engineers, who build the applications that host them.
 */
export const DOC_LINKS: DocLink[] = [
  {
    title: "Smarter Chat",
    url: "https://docs.smarter.sh/smarter-framework/smarter-chat.html",
    description: "The chat workbench: sandbox and production modes, the Console, and the server logs.",
  },
  {
    title: "@smarter.sh/ui-chat",
    url: "https://www.npmjs.com/package/@smarter.sh/ui-chat",
    description: "The npm package of this chat component, its props, and how to install it.",
  },
  {
    title: "Smarter Chat API",
    url: "https://docs.smarter.sh/smarter-framework/smarter-api/chat.html",
    description: "The REST api behind the chat: its configuration and prompt endpoints.",
  },
  {
    title: "React integration",
    url: "https://docs.smarter.sh/smarter-framework/developer-reference/react-integration.html",
    description: "How to host a Smarter chatbot in your own React application.",
  },
  {
    title: "LLMClient",
    url: "https://docs.smarter.sh/smarter-resources/smarter-llmclient.html",
    description: "The LLMClient class, which is the main interface to the Smarter API.",
  },
];
