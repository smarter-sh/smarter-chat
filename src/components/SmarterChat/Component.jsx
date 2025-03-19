//---------------------------------------------------------------------------------
//  written by: Lawrence McDaniel
//              https://lawrencemcdaniel.com
//
//  date:       Mar-2024
//---------------------------------------------------------------------------------

// React stuff
import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import ConfigPropTypes from "../../types/propTypes.js";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle, faRocket } from "@fortawesome/free-solid-svg-icons";

// Chat UI stuff
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  ConversationHeader,
  InfoButton,
  AddUserButton,
} from "@chatscope/chat-ui-kit-react";

// this repo
import { ErrorModal } from "../ErrorModal/ErrorModal.jsx";
import { Console } from "../Console/index.js";

// This component
import "./styles.css";
import { ContainerLayout, ContentLayout, WorkbenchLayout, ChatAppLayout, ConsoleLayout } from "./Layout.js";
import { MessageDirectionEnum, SenderRoleEnum } from "./enums.js";
import { fetchConfig, fetchPrompt } from "./api.js";
import { setCookie, cookieMetaFactory } from "../shared/cookie.js";
import { messageFactory, chatMessages2RequestMessages, chatInit } from "./utils.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

// The main chat component. This is the top-level component that
// is exported and used in the index.js file. It is responsible for
// managing the chat message thread, sending messages to the backend
// Api, and rendering the chat UI.
function SmarterChat({
  apiUrl, // the URL of the Smarter chatbot API. example: https://smarter.3141-5926-5359.beta.api.smarter.sh/
  apiKey, // NOT USED. TO DELETE.
  toggleMetadata, // show/hide toggle button to show/hide the chat thread metadata
  csrfCookieName = "csrftoken", // the Django CSRF cookie.
  csrftoken, // the Django CSRF token. Passed from the Django template in the Smarter web console workbench.
  debugCookieName, // the Smarter chat debug cookie. Set here.
  debugCookieExpiration, // the Smarter chat debug cookie. Set here.
  debugMode = false, // if true then show the browser console log messages. Set in Smarter web console admin waffle switches: SmarterWaffleSwitches.SMARTER_WAFFLE_REACTAPP_DEBUG_MODE
  sessionCookieName = "session_key", // the Smarter chat session cookie. Set here, where the user creates a new chat session.
  sessionCookieExpiration, // the Smarter chat session cookie. Set here, where the user creates a new chat session.
  authSessionCookieName = "sessionid", // the Django session cookie. Set when the user logs in to the Smarter web console app.
  showConsole = true, // show the server console log component
  cookieDomain, // the domain of the cookie. This is added to the cookie meta data to restrict the domain that this component will read cookie data.
}) {
  const [configApiUrl, setConfigApiUrl] = useState(apiUrl);

  const [showMetadata, setShowMetadata] = useState(toggleMetadata);
  const [isReady, setIsReady] = useState(false);
  const [config, setConfig] = useState({});
  const [placeholderText, setPlaceholderText] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [infoUrl, setInfoUrl] = useState("");
  const [fileAttachButton, setFileAttachButton] = useState(false);

  // header text
  const [title, setTitle] = useState("");
  const [info, setInfo] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);

  const [debugMode, setDebugMode] = useState(debugMode);
  const [messages, setMessages] = useState([]);

  // future use
  // const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  // const [sandboxMode, setSandboxMode] = useState(false);

  // component internal state
  const [isTyping, setIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setmodalMessage] = useState("");
  const [modalTitle, setmodalTitle] = useState("");
  const fileInputRef = useRef(null);

  // cookie management
  const csrfCookie = cookieMetaFactory(csrfCookieName, null, cookieDomain, csrftoken); // we read this but never set it.
  const authTokenCookie = cookieMetaFactory(authSessionCookieName, null, cookieDomain, null); // we read this but never set it.
  const sessionCookie = cookieMetaFactory(sessionCookieName, sessionCookieExpiration, cookieDomain, null);
  const debugCookie = cookieMetaFactory(debugCookieName, debugCookieExpiration, cookieDomain, null);
  const cookies = {
    authTokenCookie: authTokenCookie, // the Django session cookie. Set when the user logs in to the Smarter web console app.
    // typically this is not required for the chat app when running inside the
    // Smarter web console workbench, since it is already authenticated.

    csrfCookie: csrfCookie, // the Django CSRF cookie. This is required for requests to the Smarter web console workbench.
    sessionCookie: sessionCookie, // the Smarter chat session cookie. Set here, where the user creates a new chat session.
    debugCookie: debugCookie, // the Smarter chat debug cookie. Set here. Controls browser console logging.
  };

  const refetchConfig = async () => {
    const newConfig = await fetchConfig(configApiUrl, cookies);
    setDebugMode(newConfig?.debug_mode);
    setCookie(cookies.debugCookie, debugMode);

    if (debugMode) {
      console.log("refetchConfig() config:", newConfig);
    }

    PropTypes.checkPropTypes(ConfigPropTypes, newConfig, "prop", "SmarterChat");
    setConfig(newConfig);
    return newConfig;
  };

  const fetchAndSetConfig = async () => {
    try {
      const newConfig = await refetchConfig();

      if (debugMode) {
        console.log("fetchAndSetConfig() config:", newConfig);
      }

      setPlaceholderText(newConfig.chatbot.app_placeholder);
      setConfigApiUrl(newConfig.chatbot.url_chatbot);
      setAssistantName(newConfig.chatbot.app_assistant);
      setInfoUrl(newConfig.chatbot.app_info_url);
      setFileAttachButton(newConfig.chatbot.app_file_attachment);
      setIsValid(newConfig.meta_data.is_valid);
      setIsDeployed(newConfig.meta_data.is_deployed);
      setDebugMode(newConfig.debug_mode);

      // wrap up the rest of the initialization
      const newHistory = newConfig.history?.chat_history || [];
      const newThread = chatInit(
        newConfig.chatbot.app_welcome_message,
        newConfig.chatbot.default_system_role,
        newConfig.chatbot.app_example_prompts,
        newConfig.session_key,
        newHistory,
        "BACKEND_CHAT_MOST_RECENT_RESPONSE",
      );
      setMessages(newThread);

      const newTitle = `${newConfig.chatbot.app_name} v${newConfig.chatbot.version || "1.0.0"}`;
      setTitle(newTitle);
      let newInfo = `${newConfig.chatbot.provider} ${newConfig.chatbot.default_model}`;
      if (newConfig.plugins.meta_data.total_plugins > 0) {
        newInfo += ` with ${newConfig.plugins.meta_data.total_plugins} additional plugins`;
      }
      setInfo(newInfo);
      setIsReady(true);
      setIsTyping(false);

      if (debugMode) {
        console.log("fetchAndSetConfig() done!");
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    }
  };

  // Lifecycle hooks
  useEffect(() => {
    if (debugMode) {
      console.log("ChatApp() component mounted");
    }

    fetchAndSetConfig();

    return () => {
      if (debugMode) {
        console.log("ChatApp() component unmounted");
      }
    };
  }, []);

  // Error modal state management
  function openErrorModal(title, msg) {
    setIsModalOpen(true);
    setmodalTitle(title);
    setmodalMessage(msg);
  }

  function closeChatModal() {
    setIsModalOpen(false);
  }

  const handleInfoButtonClick = () => {
    const newValue = !showMetadata;
    setShowMetadata(newValue);
    if (debugMode) {
      console.log("showMetadata:", newValue);
    }
    const newMessages = messages.map((message) => {
      if (message.message === null) {
        return { ...message, display: false };
      }
      if (["smarter", "system", "tool"].includes(message.sender)) {
        // toggle backend messages
        return { ...message, display: newValue };
      } else {
        // always show user and assistant messages
        return { ...message, display: true };
      }
    });
    setMessages(newMessages);
  };

  const handleAddUserButtonClick = () => {
    setCookie(cookies.sessionCookie, "");
    fetchAndSetConfig();
  };

  async function handleApiRequest(input_text, base64_encode = false) {
    // Api request handler. This function is indirectly called by UI event handlers
    // inside this module. It asynchronously sends the user's input to the
    // backend Api using the fetch() function. The response from the Api is
    // then used to update the chat message thread and the UI via React state.
    const newMessage = messageFactory({}, input_text, MessageDirectionEnum.OUTGOING, SenderRoleEnum.USER);
    if (base64_encode) {
      console.error("base64 encoding not implemented yet.");
    }

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];
      setIsTyping(true);

      (async () => {
        try {
          if (debugMode) {
            console.log("handleApiRequest() messages:", updatedMessages);
          }
          const msgs = chatMessages2RequestMessages(updatedMessages);
          const response = await fetchPrompt(config, msgs, cookies);

          if (response) {
            const responseMessages = response.smarter.messages
              .filter((message) => message.content !== null)
              .map((message) => {
                return messageFactory(message, message.content, MessageDirectionEnum.INCOMING, message.role);
              });
            setMessages((prevMessages) => [...prevMessages, ...responseMessages]);
            setIsTyping(false);
            refetchConfig();
          }
        } catch (error) {
          setIsTyping(false);
          console.error("Api error: ", error);
          openErrorModal("Api error", error.message);
        }
      })();

      return updatedMessages;
    });
  }

  // file upload event handlers
  const handleAttachClick = async () => {
    fileInputRef.current.click();
  };
  function handleFileChange(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileContent = event.target.result;
      handleApiRequest(fileContent, true);
    };
    reader.readAsText(file);
  }

  // send button event handler
  const handleSend = (input_text) => {
    // remove any HTML tags from the input_text. Pasting text into the
    // input box (from any source) tends to result in HTML span tags being included
    // in the input_text. This is a problem because the Api doesn't know how to
    // handle HTML tags. So we remove them here.
    const sanitized_input_text = input_text.replace(/<[^>]+>/g, "");

    // check if the sanitized input text is empty or only contains whitespace
    if (!sanitized_input_text.trim()) {
      return;
    }
    handleApiRequest(sanitized_input_text, false);
  };

  // Creates a fancier title for the chat app which includes
  // fontawesome icons for validation and deployment status.
  function AppTitle({ title, isValid, isDeployed }) {
    return (
      <div>
        {isReady ? (
          <>
            {title}&nbsp;
            {isValid ? (
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: "green" }} />
            ) : (
              <FontAwesomeIcon icon={faTimesCircle} style={{ color: "red" }} />
            )}
            {isDeployed ? (
              <>
                &nbsp;
                <FontAwesomeIcon icon={faRocket} style={{ color: "orange" }} />
              </>
            ) : null}
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }

  function SmarterMessage({ i, message }) {
    let messageClassNames = "";
    if (message.sender === "smarter") {
      messageClassNames = "smarter-message";
    } else if (["tool", "system"].includes(message.sender)) {
      messageClassNames = "system-message";
    }
    return <Message key={i} model={message} className={messageClassNames} />;
  }

  // UI widget styles
  // note that most styling is intended to be created in Component.css
  // these are outlying cases where inline styles are required in order to override the default styles
  const fullWidthStyle = {
    width: "100%",
  };
  const transparentBackgroundStyle = {
    backgroundColor: "rgba(0,0,0,0.10)",
    color: "lightgray",
  };
  const mainContainerStyleOverrides = {
    width: "100%",
    height: "100%",
  };
  const chatContainerStyleOverrides = {
    ...fullWidthStyle,
    ...transparentBackgroundStyle,
  };

  // render the chat app
  return (
    <div id="smarter_chat_component_container" className="SmarterChat">
      <ContainerLayout>
        <ContentLayout>
          <WorkbenchLayout>
            <ChatAppLayout>
              <div className="chat-app">
                <MainContainer style={mainContainerStyleOverrides}>
                  <ErrorBoundary>
                    <ErrorModal
                      isModalOpen={isModalOpen}
                      title={modalTitle}
                      message={modalMessage}
                      onCloseClick={closeChatModal}
                    />
                  </ErrorBoundary>
                  <ChatContainer style={chatContainerStyleOverrides}>
                    <ConversationHeader>
                      <ConversationHeader.Content
                        userName={
                          isReady ? (
                            <AppTitle title={title} isValid={isValid} isDeployed={isDeployed} />
                          ) : (
                            "Configuring workbench..."
                          )
                        }
                        info={isReady ? info : ""}
                      />
                      <ConversationHeader.Actions>
                        <AddUserButton onClick={handleAddUserButtonClick} title="Start a new chat" />
                        {toggleMetadata && (
                          <InfoButton onClick={handleInfoButtonClick} title="Toggle system meta data" />
                        )}
                      </ConversationHeader.Actions>
                    </ConversationHeader>
                    <MessageList
                      style={transparentBackgroundStyle}
                      scrollBehavior="auto"
                      typingIndicator={isTyping ? <TypingIndicator content={assistantName + " is typing"} /> : null}
                    >
                      {messages
                        .filter((message) => message.display)
                        .map((message, i) => {
                          return <SmarterMessage i={i} message={message} />;
                        })}
                    </MessageList>
                    <MessageInput
                      placeholder={placeholderText}
                      onSend={handleSend}
                      onAttachClick={handleAttachClick}
                      attachButton={fileAttachButton}
                      fancyScroll={false}
                    />
                  </ChatContainer>
                  <input
                    type="file"
                    accept=".py"
                    title="Select a Python file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </MainContainer>
              </div>
            </ChatAppLayout>
            {showConsole && (
              <ConsoleLayout>
                <Console config={config} />
              </ConsoleLayout>
            )}
          </WorkbenchLayout>
        </ContentLayout>
      </ContainerLayout>
    </div>
  );
}

export default SmarterChat;
