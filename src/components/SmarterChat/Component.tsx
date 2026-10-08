/**
 * SmarterChat: a chat with a Smarter LLMClient, with an optional Console beside it.
 *
 * It fetches the LLMClient's configuration, which includes the chat session's history, then sends
 * the chat thread to the LLMClient's prompt api with each new message, and adds the response's
 * messages to the thread. Failed prompts are displayed in the thread, as "smarter_error" messages.
 * While a prompt runs, its progress (e.g. its tool calls and MCP server requests) is displayed in
 * the thread, and is replaced by the response's messages when it finishes.
 *
 * The user can resize the chat and the Console by dragging the separator between them, and can
 * hide the Console, which slides out to the right. In sandbox mode, the thread also displays
 * Smarter's system, tool and meta data messages. In production mode, it displays only the
 * conversation, as the LLMClient's users see it. A new chat also clears the Console's server logs.
 *
 * This is the component that the @smarter.sh/ui-chat npm package exports, and that the Smarter web
 * console's LLMClient prompt workbench renders. See main.tsx.
 */
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  Button,
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import { DEFAULT_COOKIE_EXPIRATION, loggerPrefix, projectName, projectVersion } from "../../const";
import { fetchConfig, fetchPrompt, type PromptProgressEvent } from "../../lib/api";
import { cookieMetaFactory, setCookie } from "../../lib/cookie";
import { MetadataRolesEnum, SenderRoleEnum } from "../../lib/enums";
import { useChatWidth, useConsoleVisible } from "../../lib/layout";
import {
  chatInit,
  chatMessages2RequestMessages,
  messageFactory,
  sanitizeInput,
  toggleMetadataMessages,
} from "../../lib/messages";
import type { ChatConfig, ChatCookies, ChatMessage, ClientContext, SmarterChatProps } from "../../types";
import AppTitle from "../AppTitle";
import Console from "../Console";
import ErrorBoundary from "../ErrorBoundary";
import { ConsoleIcon, NewChatIcon, ProductionIcon, SandboxIcon } from "./icons";
import "./styles.css";

/** The css class of a message, by its sender. */
function messageClassName(sender: string): string {
  if (sender === SenderRoleEnum.SMARTER) return "smarter-message";
  if (sender === SenderRoleEnum.SMARTER_ERROR) return "smarter-error-message";
  if (sender === SenderRoleEnum.TOOL || sender === SenderRoleEnum.SYSTEM) return "system-message";
  return "";
}

/** A step of the running prompt, as a chat message, which is never sent to the api. */
function progressMessage(event: PromptProgressEvent) {
  return messageFactory(event.message, SenderRoleEnum.SMARTER).message;
}

function SmarterChat({
  apiUrl,
  apiKey = null,
  toggleMetadata = false,
  csrfCookieName = "csrftoken",
  csrftoken = null,
  debugCookieName = "debug",
  debugCookieExpiration = DEFAULT_COOKIE_EXPIRATION,
  debugMode = false,
  sessionCookieName = "session_key",
  sessionCookieExpiration = DEFAULT_COOKIE_EXPIRATION,
  showConsole = true,
  cookieDomain = "",
  smarterRequestId = "",
  logStreamUrl = null,
  streamProgress = true,
}: SmarterChatProps) {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState<PromptProgressEvent[]>([]);
  const [consoleVisible, setConsoleVisible] = useConsoleVisible();
  // counts the new chats, which clear the Console's server logs.
  const [chatCount, setChatCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAppRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { chatWidth, separatorProps } = useChatWidth(containerRef);
  const isSplit = showConsole && consoleVisible;

  const cookies: ChatCookies = useMemo(
    () => ({
      // Django's CSRF cookie. Read, never set.
      csrfCookie: cookieMetaFactory(csrfCookieName, null, cookieDomain, csrftoken),
      // the chat session's key, per page path, so that each LLMClient has its own chat session.
      sessionCookie: cookieMetaFactory(sessionCookieName, sessionCookieExpiration, cookieDomain),
      debugCookie: cookieMetaFactory(debugCookieName, debugCookieExpiration, cookieDomain),
    }),
    [
      csrfCookieName,
      csrftoken,
      cookieDomain,
      sessionCookieName,
      sessionCookieExpiration,
      debugCookieName,
      debugCookieExpiration,
    ],
  );
  const context: ClientContext = useMemo(
    () => ({ smarterClient: projectName, smarterClientVersion: projectVersion, smarterRequestId, apiKey }),
    [smarterRequestId, apiKey],
  );
  const debug = useCallback(
    (...args: unknown[]) => {
      if (debugMode || config?.debug_mode) console.log(loggerPrefix, ...args);
    },
    [debugMode, config?.debug_mode],
  );

  /** (Re)loads the configuration, which includes the chat session's history, for the Console. */
  const refreshConfig = useCallback(async () => {
    const newConfig = await fetchConfig(apiUrl, cookies, context);
    setConfig(newConfig);
    return newConfig;
  }, [apiUrl, cookies, context]);

  /** Starts, or restores, the chat session. */
  const startChat = useCallback(async () => {
    try {
      setConfigError(null);
      const newConfig = await refreshConfig();
      const chatbot = newConfig.chatbot;
      setMessages(
        chatInit(
          chatbot.app_welcome_message,
          chatbot.default_system_role,
          chatbot.app_example_prompts,
          newConfig.history?.chat_history,
        ),
      );
      setShowMetadata(true);
      setIsTyping(false);
      debug("chat started", newConfig);
    } catch (error) {
      console.error(`${loggerPrefix} Failed to fetch the configuration:`, error);
      setConfigError(error instanceof Error ? error.message : String(error));
    }
  }, [refreshConfig, debug]);

  useEffect(() => {
    // the first render. startChat() sets state only once the configuration arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  useEffect(() => {
    // @chatscope's message input is a contenteditable div, without a role or a name.
    const editor = chatAppRef.current?.querySelector(".cs-message-input__content-editor");
    editor?.setAttribute("role", "textbox");
    editor?.setAttribute("aria-multiline", "true");
    editor?.setAttribute("aria-label", "Message");
  }, []);

  const handleNewChat = () => {
    setCookie(cookies.sessionCookie, "");
    setConfig(null);
    setChatCount((count) => count + 1);
    void startChat();
  };

  const handleToggleMetadata = () => {
    const show = !showMetadata;
    setShowMetadata(show);
    setMessages((previous) => toggleMetadataMessages(previous, show, MetadataRolesEnum));
  };

  /** Sends the thread, with the user's new message, to the prompt api. */
  async function sendMessage(text: string) {
    if (!config) return;
    const thread = [...messages, messageFactory(text, SenderRoleEnum.USER)];
    setMessages(thread);
    setIsTyping(true);
    setProgress([]);
    const onProgress = streamProgress
      ? (event: PromptProgressEvent) => {
          debug("prompt progress", event);
          setProgress((previous) => [...previous, event]);
        }
      : undefined;
    try {
      const result = await fetchPrompt(config, chatMessages2RequestMessages(thread), cookies, context, onProgress);
      const responseMessages = result.messages.map((message) => {
        const chatMessage = messageFactory(message.content, message.role, message);
        const hidden = MetadataRolesEnum.includes(chatMessage.sender as never) && !showMetadata;
        return hidden ? { ...chatMessage, display: false } : chatMessage;
      });
      setMessages((previous) => [...previous, ...responseMessages]);
      debug("prompt response", result);
      // the Console displays the session's history, which the prompt changed.
      await refreshConfig().catch((error) => console.error(`${loggerPrefix} Failed to refresh:`, error));
    } catch (error) {
      console.error(`${loggerPrefix} Prompt failed:`, error);
      const errorText = error instanceof Error ? error.message : String(error);
      setMessages((previous) => [...previous, messageFactory(errorText, SenderRoleEnum.SMARTER_ERROR)]);
    } finally {
      setIsTyping(false);
      setProgress([]);
    }
  }

  // MessageInput passes its html, text content and inner text. The text has no html.
  const handleSend = (innerHtml: string, textContent: string, innerText: string) => {
    const text = innerText ?? textContent ?? sanitizeInput(innerHtml);
    if (!text.trim()) return;
    void sendMessage(text);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => void sendMessage(text));
    event.target.value = "";
  };

  const chatbot = config?.chatbot;
  const isReady = !!config;
  const title = chatbot ? `${chatbot.app_name} v${chatbot.version || "1.0.0"}` : "";
  const totalPlugins = config?.plugins?.meta_data?.total_plugins ?? 0;
  const info = chatbot
    ? `${chatbot.provider} ${chatbot.default_model}${totalPlugins > 0 ? ` with ${totalPlugins} additional plugins` : ""}`
    : "";
  const isValid = config?.meta_data?.is_valid ?? config?.meta_data?.ready ?? true;
  const isDeployed = !!(config?.meta_data?.is_deployed ?? chatbot?.deployed);

  const assistant = chatbot?.app_assistant ?? "Assistant";
  const currentStep = progress.at(-1)?.message;
  const typingText = currentStep ? `${assistant}: ${currentStep}` : `${assistant} is typing`;

  let headerName;
  if (configError) {
    headerName = "Smarter Chat is not available";
  } else if (isReady) {
    headerName = <AppTitle title={title} isReady={isReady} isValid={isValid} isDeployed={isDeployed} />;
  } else {
    headerName = "Configuring workbench...";
  }

  return (
    <div id="smarter_chat_component_container" className="SmarterChat">
      <div className="smarter-chat-container" ref={containerRef}>
        <div
          role="region"
          aria-label="Chat"
          className={`smarter-chat-app ${isSplit ? "" : "smarter-chat-app-full"}`}
          style={isSplit ? { flexBasis: `${chatWidth}%` } : undefined}
        >
          <div className="chat-app" ref={chatAppRef}>
            <ErrorBoundary>
              <MainContainer style={{ width: "100%", height: "100%" }}>
                <ChatContainer className="smarter-chat-container-inner">
                  <ConversationHeader>
                    <ConversationHeader.Content userName={headerName} info={isReady ? info : ""} />
                    <ConversationHeader.Actions>
                      {toggleMetadata && (
                        <Button
                          className="smarter-chat-toolbar-button smarter-chat-mode-toggle"
                          icon={showMetadata ? <SandboxIcon /> : <ProductionIcon />}
                          onClick={handleToggleMetadata}
                          title={
                            showMetadata
                              ? "Sandbox mode: Smarter's system, tool and meta data messages are displayed. Click for production mode."
                              : "Production mode: the conversation is displayed as its users see it. Click for sandbox mode."
                          }
                        >
                          {showMetadata ? "Sandbox mode" : "Production mode"}
                        </Button>
                      )}
                      <Button
                        className="smarter-chat-toolbar-button"
                        icon={<NewChatIcon />}
                        onClick={handleNewChat}
                        title="Start a new chat"
                        aria-label="Start a new chat"
                      />
                      {showConsole && (
                        <Button
                          className="smarter-chat-toolbar-button smarter-chat-console-toggle"
                          icon={<ConsoleIcon visible={consoleVisible} />}
                          onClick={() => setConsoleVisible((visible) => !visible)}
                          title={consoleVisible ? "Hide the Console" : "Show the Console"}
                          aria-label="Show the Console"
                          aria-pressed={consoleVisible}
                        />
                      )}
                    </ConversationHeader.Actions>
                  </ConversationHeader>
                  <MessageList
                    className="smarter-chat-message-list"
                    scrollBehavior="auto"
                    typingIndicator={isTyping ? <TypingIndicator content={typingText} /> : null}
                  >
                    {configError && (
                      <Message
                        className="smarter-error-message"
                        model={{
                          message: messageFactory(configError, SenderRoleEnum.SMARTER_ERROR).message,
                          direction: "incoming",
                          position: "single",
                          sender: SenderRoleEnum.SMARTER_ERROR,
                        }}
                      />
                    )}
                    {messages.map((message, index) =>
                      message.display ? (
                        <Message
                          key={index}
                          className={messageClassName(message.sender)}
                          model={{
                            message: message.message,
                            sentTime: message.sentTime,
                            sender: message.sender,
                            direction: message.direction,
                            position: "single",
                          }}
                        />
                      ) : null,
                    )}
                    {showMetadata &&
                      progress.map((event, index) => (
                        <Message
                          key={`progress-${index}`}
                          className="smarter-progress-message"
                          model={{
                            message: progressMessage(event),
                            sender: SenderRoleEnum.SMARTER,
                            direction: "incoming",
                            position: "single",
                          }}
                        />
                      ))}
                  </MessageList>
                  <MessageInput
                    placeholder={chatbot?.app_placeholder ?? ""}
                    onSend={handleSend}
                    onAttachClick={() => fileInputRef.current?.click()}
                    attachButton={!!chatbot?.app_file_attachment}
                    disabled={!isReady}
                    fancyScroll={false}
                  />
                </ChatContainer>
              </MainContainer>
            </ErrorBoundary>
            <input
              type="file"
              accept=".py,.txt,.md,.json,.yaml,.yml,.csv"
              aria-label="Attach a file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        </div>
        {isSplit && <div className="smarter-chat-separator" {...separatorProps} />}
        {/* hidden, rather than removed, so that the Console keeps its tab and its streamed logs, and
            so that it can slide out of view, and back. See styles.css. */}
        {showConsole && (
          <div
            className={`smarter-chat-console ${consoleVisible ? "" : "smarter-chat-console-hidden"}`}
            aria-hidden={!consoleVisible}
            inert={!consoleVisible}
          >
            <ErrorBoundary>
              <Console config={config} logStreamUrl={logStreamUrl} resetKey={chatCount} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

export default SmarterChat;
