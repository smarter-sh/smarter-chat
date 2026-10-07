import { describe, expect, it } from "vitest";

import { chatHistory } from "@/mocks/fixtures";

import { MetadataRolesEnum } from "./enums";
import {
  chatInit,
  chatIntro,
  chatMessages2RequestMessages,
  convertMarkdownLinksToHTML,
  examplePrompts,
  messageFactory,
  sanitizeInput,
  toggleMetadataMessages,
} from "./messages";

describe("convertMarkdownLinksToHTML", () => {
  it("converts markdown links to html links, which open in a new tab", () => {
    expect(convertMarkdownLinksToHTML("See [the docs](https://docs.smarter.sh).")).toBe(
      'See <a href="https://docs.smarter.sh" target="_blank" rel="noopener noreferrer">the docs</a>.',
    );
  });

  it("escapes html, so that a message cannot inject markup or scripts", () => {
    expect(convertMarkdownLinksToHTML('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("does not link javascript: urls", () => {
    expect(convertMarkdownLinksToHTML("[click](javascript:alert(1))")).not.toContain("<a");
  });
});

describe("messageFactory", () => {
  it("displays a message with text, as html, and keeps its text for the api", () => {
    const message = messageFactory("a < b", "user");
    expect(message).toMatchObject({ message: "a &lt; b", content: "a < b", direction: "outgoing", display: true });
  });

  it("keeps a message without text in the thread, without displaying it", () => {
    const message = messageFactory(null, "assistant");
    expect(message).toMatchObject({ message: "", content: null, direction: "incoming", display: false });
  });
});

describe("chatInit", () => {
  it("introduces a new chat session with the system role, the welcome message and example prompts", () => {
    const messages = chatInit("Welcome!", "You are helpful.", ["Hi?"], []);
    expect(messages.map((message) => [message.sender, message.content])).toEqual([
      ["system", "You are helpful."],
      ["assistant", "Welcome!"],
      ["assistant", examplePrompts(["Hi?"])],
    ]);
  });

  it("has no example prompts message without example prompts", () => {
    expect(chatIntro("Welcome!", "You are helpful.", [])).toHaveLength(2);
    expect(examplePrompts(null)).toBe("");
  });

  it("restores a chat session from its history", () => {
    const messages = chatInit("Welcome!", "You are helpful.", [], chatHistory);
    expect(messages).toHaveLength(chatHistory.length);
    expect(messages.filter((message) => message.display)).toHaveLength(chatHistory.length - 1);
  });
});

describe("chatMessages2RequestMessages", () => {
  it("sends the api's messages back with their original fields and text, without Smarter's own", () => {
    const thread = [
      ...chatInit("", "", [], chatHistory),
      messageFactory("Smarter selected a plugin.", "smarter"),
      messageFactory("What about [links](https://example.com)?", "user"),
    ];
    const request = chatMessages2RequestMessages(thread);
    expect(request).toHaveLength(chatHistory.length + 1);
    expect(request[3]).toEqual(chatHistory[3]);
    expect(request[4]).toEqual(chatHistory[4]);
    expect(request[request.length - 1]).toEqual({ role: "user", content: "What about [links](https://example.com)?" });
  });
});

describe("toggleMetadataMessages", () => {
  it("hides and shows the backend's messages, and always shows the rest", () => {
    const thread = [
      messageFactory("system role", "system"),
      messageFactory("hello", "user"),
      messageFactory(null, "assistant"),
    ];
    const hidden = toggleMetadataMessages(thread, false, MetadataRolesEnum);
    expect(hidden.map((message) => message.display)).toEqual([false, true, false]);
    const shown = toggleMetadataMessages(hidden, true, MetadataRolesEnum);
    expect(shown.map((message) => message.display)).toEqual([true, true, false]);
  });
});

describe("sanitizeInput", () => {
  it("removes html tags", () => {
    expect(sanitizeInput("<span>hello</span> world")).toBe("hello world");
  });
});
