/** A technical reference that the Docs dialog links to. */
export interface DocLink {
  title: string;
  url: string;
  description: string;
}

/** A tab of the Docs dialog: the technical references for one audience. */
export interface DocSection {
  title: string;
  description: string;
  links: DocLink[];
}

/** The technical references for prompt engineers, who build LLMClients in the sandbox. */
export const PROMPT_ENGINEER_LINKS: DocLink[] = [
  {
    title: "Smarter Chat",
    url: "https://docs.smarter.sh/smarter-framework/smarter-chat.html",
    description: "The chat workbench: sandbox and production modes, the Console, and the server logs.",
  },
  {
    title: "LLMClient",
    url: "https://docs.smarter.sh/smarter-resources/smarter-llmclient.html",
    description: "The LLMClient class, which is the main interface to the Smarter API.",
  },
  {
    title: "LLM Tools",
    url: "https://docs.smarter.sh/smarter-framework/extensibility.html",
    description: "How to leverage LLM tool calling with Smarter.",
  },
  {
    title: "Guardrail",
    url: "https://docs.smarter.sh/smarter-resources/smarter-guardrail.html",
    description: "How to create and use guardrails with the Smarter API.",
  },
  {
    title: "Budget",
    url: "https://docs.smarter.sh/smarter-resources/smarter-budget.html",
    description: "How to create and use budgets with the Smarter API.",
  },
];

/** The technical references for software engineers, who build the applications that host them. */
export const SOFTWARE_ENGINEER_LINKS: DocLink[] = [
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
    title: "Smarter on Kubernetes",
    url: "https://docs.smarter.sh/smarter-framework/smarter-on-kubernetes.html",
    description: "What deploying an LLMClient creates in Kubernetes, and how to operate it in production.",
  },
];

/** The tabs of the Docs dialog, from left to right. The first one is selected when it opens. */
export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Prompt Engineer",
    description: "Building and testing LLMClients in the sandbox.",
    links: PROMPT_ENGINEER_LINKS,
  },
  {
    title: "Software Engineer",
    description: "Hosting an LLMClient in your own application.",
    links: SOFTWARE_ENGINEER_LINKS,
  },
];
