/**
 * The chat thread: building it from the LLMClient's configuration and history, adding messages to
 * it, and turning it back into the api's messages.
 *
 * Messages are displayed as html (by @chatscope/chat-ui-kit-react). Their text, which comes from the
 * user and from the LLM, is escaped, and only markdown images and links become html.
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

// the urls that messages may link to, and display images from: http(s), and relative to the page.
const URL_PATTERN = String.raw`(?:https?:\/\/|\/)[^\s)"]+`;
// images may also be inline, e.g. from a tool that generates them. Raster formats only: no svg.
const IMAGE_URL_PATTERN = String.raw`(?:${URL_PATTERN}|data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+)`;
const IMAGE_PATTERN = String.raw`!\[([^\]]*)\]\((${IMAGE_URL_PATTERN})\)`;

const linkedImageRegex = new RegExp(String.raw`\[${IMAGE_PATTERN}\]\((${URL_PATTERN})\)`, "g");
const imageRegex = new RegExp(IMAGE_PATTERN, "g");
const linkRegex = new RegExp(String.raw`\[([^\]]+)\]\((${URL_PATTERN})\)`, "g");

function anchor(href: string, content: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
}

/** An image, sized to fit its chat bubble by the "smarter-chat-image" css class. See styles.css. */
function image(src: string, alt: string): string {
  return `<img class="smarter-chat-image" src="${src}" alt="${alt}" loading="lazy">`;
}

/**
 * Html for a message's text: escaped, with markdown images and links as html.
 *
 * - ``![alt](url)`` is an image, which opens at full size in a new tab, unless it's a data url,
 *   which browsers don't open.
 * - ``[![alt](url)](href)`` is an image that links to href.
 * - ``[text](href)`` is a link, which opens in a new tab.
 *
 * Urls are http(s) or relative to the page. Images may also be base64 png, jpeg, gif or webp data
 * urls. Anything else, e.g. a javascript: url, stays as text.
 */
export function convertMarkdownLinksToHTML(text: string): string {
  return escapeHtml(text)
    .replace(linkedImageRegex, (_match, alt: string, src: string, href: string) => anchor(href, image(src, alt)))
    .replace(imageRegex, (_match, alt: string, src: string) =>
      src.startsWith("data:") ? image(src, alt) : anchor(src, image(src, alt)),
    )
    .replace(linkRegex, (_match, label: string, href: string) => anchor(href, label));
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
