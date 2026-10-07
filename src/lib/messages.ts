/**
 * The chat thread: building it from the LLMClient's configuration and history, adding messages to
 * it, and turning it back into the api's messages.
 *
 * Messages are displayed as html (by @chatscope/chat-ui-kit-react). Their text, which comes from the
 * user and from the LLM, is escaped, and only markdown links become html.
 */
import type { ApiMessage, ChatMessage } from "../types";
import { MessageDirectionEnum, SenderRoleEnum, ValidMessageRolesEnum, type MessageDirection } from "./enums";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

/** Html for a message's text: escaped, with markdown links to http(s) and relative urls as html links. */
export function convertMarkdownLinksToHTML(text: string): string {
  const markdownLinkRegex = /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g;
  return escapeHtml(text).replace(markdownLinkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/** The direction of a message from the given sender. */
export function directionOf(sender: string): MessageDirection {
  return sender === SenderRoleEnum.USER ? MessageDirectionEnum.OUTGOING : MessageDirectionEnum.INCOMING;
}

/**
 * A new chat message. Messages without text, e.g. an assistant's tool calls, stay in the thread,
 * so that they are sent back to the api, but are not displayed.
 */
export function messageFactory(
  content: string | null | undefined,
  sender: string,
  originalMessage?: ApiMessage,
  direction: MessageDirection = directionOf(sender),
): ChatMessage {
  const display = typeof content === "string" && content !== "";
  return {
    message: display ? convertMarkdownLinksToHTML(content) : "",
    content: content ?? null,
    direction,
    sender,
    sentTime: new Date().toLocaleString(),
    display,
    originalMessage,
  };
}

/** The thread of a chat session, from the messages that the backend saved. */
export function chatRestoreFromBackend(chatHistory: ApiMessage[] | null | undefined): ChatMessage[] {
  return (chatHistory ?? [])
    .filter((message) => message && typeof message === "object" && typeof message.role === "string")
    .map((message) => messageFactory(message.content, message.role, message));
}

/** Example prompts, which help the user to get started. */
export function examplePrompts(prompts: string[] | null | undefined): string {
  if (!prompts || prompts.length === 0) {
    return "";
  }
  return "Some example prompts to get you started:\r\n\r\n" + prompts.map((prompt) => `${prompt}\r\n`).join("");
}

/** The thread of a new chat session: the system role, the welcome message, and example prompts. */
export function chatIntro(welcomeMessage: string, systemRole: string, prompts: string[] | null | undefined) {
  const messages = [
    messageFactory(systemRole, SenderRoleEnum.SYSTEM),
    messageFactory(welcomeMessage, SenderRoleEnum.ASSISTANT),
  ];
  const examples = examplePrompts(prompts);
  if (examples) {
    messages.push(messageFactory(examples, SenderRoleEnum.ASSISTANT));
  }
  return messages;
}

/** The thread of a chat session: its saved history, or the introduction to a new one. */
export function chatInit(
  welcomeMessage: string,
  systemRole: string,
  prompts: string[] | null | undefined,
  chatHistory: ApiMessage[] | null | undefined,
): ChatMessage[] {
  const messages = chatRestoreFromBackend(chatHistory);
  return messages.length > 0 ? messages : chatIntro(welcomeMessage, systemRole, prompts);
}

/**
 * The thread as the api's messages: those the LLM accepts, without Smarter's own. The api's
 * original messages keep their other fields, e.g. an assistant's tool_calls.
 */
export function chatMessages2RequestMessages(messages: ChatMessage[]): ApiMessage[] {
  return messages
    .filter((message) => (ValidMessageRolesEnum as string[]).includes(message.sender))
    .map((message) => ({ ...message.originalMessage, role: message.sender, content: message.content }));
}

/** Shows or hides the backend's messages (smarter, system and tool), and always shows the rest. */
export function toggleMetadataMessages(messages: ChatMessage[], show: boolean, metadataRoles: string[]): ChatMessage[] {
  return messages.map((message) => {
    if (!message.message) {
      return { ...message, display: false };
    }
    return { ...message, display: metadataRoles.includes(message.sender) ? show : true };
  });
}

/** Removes html tags, which pasting text into the message input tends to add. */
export function sanitizeInput(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}
