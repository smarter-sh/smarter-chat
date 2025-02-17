//---------------------------------------------------------------------------------
//  written by: Lawrence McDaniel
//              https://lawrencemcdaniel.com
//
//  date:       Mar-2024
//---------------------------------------------------------------------------------

// React stuff
import React, { useRef, useState, useEffect } from "react";

// see: https://www.npmjs.com/package/styled-components
import styled from "styled-components";

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

// This component
import "./styles.css";
import { MessageDirectionEnum, SenderRoleEnum } from "./enums.js";
import { setCookie, fetchConfig, fetchPrompt } from "./api.js";
import { cookieMetaFactory, messageFactory, chatMessages2RequestMessages, chatInit } from "./utils.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import { DEBUG_MODE } from "../../shared/constants.js";

export const ContainerLayout = styled.div`
  height: 100%;
  display: flex;
  flex-direction: row;
`;

export const ContentLayout = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
  height: 100%;
`;

export const ComponentLayout = styled.div`
  flex-basis: 100%;
  margin: 0;
  padding: 5px;
  height: 100%;
  @media (max-width: 992px) {
    flex-basis: 100%;
  }
`;

// The main chat component. This is the top-level component that
// is exported and used in the index.js file. It is responsible for
// managing the chat message thread, sending messages to the backend
// Api, and rendering the chat UI.
function SmarterChat({
  apiUrl,
  apiKey,
  toggleMetadata,
  csrfCookieName,
  debugCookieName,
  debugCookieExpiration,
  sessionCookieName,
  sessionCookieExpiration,
}) {
  const csrfCookie = cookieMetaFactory(csrfCookieName, null); // we read this but never set it.
  const sessionCookie = cookieMetaFactory(sessionCookieName, sessionCookieExpiration);
  const debugCookie = cookieMetaFactory(debugCookieName, debugCookieExpiration);
  const cookies = {
    csrfCookie: csrfCookie,
    sessionCookie: sessionCookie,
    debugCookie: debugCookie,
  };

  const [configApiUrl, setConfigApiUrl] = useState(apiUrl);
  const [showMetadata, setShowMetadata] = useState(toggleMetadata);

  const [config, setConfig] = useState({});
  const [placeholderText, setPlaceholderText] = useState("");
  const [assistantName, setAssistantName] = useState("");
  const [infoUrl, setInfoUrl] = useState("");
  const [fileAttachButton, setFileAttachButton] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [debugMode, setDebugMode] = useState(DEBUG_MODE);
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState("");
  const [info, setInfo] = useState("");

  // future use
  // const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  // const [sandboxMode, setSandboxMode] = useState(false);

  // component internal state
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);

  const refetchConfig = async () => {
    const newConfig = await fetchConfig(configApiUrl, cookies);

    if (newConfig?.debug_mode) {
      console.log("fetchAndSetConfig()...");
      console.log("fetchAndSetConfig() config:", newConfig);
    }

    setConfig(newConfig);
    return newConfig;
  };

  const fetchAndSetConfig = async () => {
    try {
      const newConfig = await refetchConfig();

      console.log("fetchAndSetConfig() config:", newConfig);

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

      if (newConfig?.debug_mode) {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setmodalMessage] = useState("");
  const [modalTitle, setmodalTitle] = useState("");

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
        if (debugMode) {
          //console.log("toggle message:", message);
        }
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
  const mainContainerStyle = {
    // backgroundImage:
    //   "linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, .75)), apiUrl('" +
    //   background_image_url +
    //   "')",
    // backgroundSize: "cover",
    // backgroundPosition: "center",
    width: "100%",
    height: "100%",
  };
  const chatContainerStyle = {
    ...fullWidthStyle,
    ...transparentBackgroundStyle,
  };

  // render the chat app
  return (
    <div id="smarter_chat_component_container" className="SmarterChat">
      <ContainerLayout>
        <ContentLayout>
          <ComponentLayout>
            <div className="chat-app">
              <MainContainer style={mainContainerStyle}>
                <ErrorBoundary>
                  <ErrorModal
                    isModalOpen={isModalOpen}
                    title={modalTitle}
                    message={modalMessage}
                    onCloseClick={closeChatModal}
                  />
                </ErrorBoundary>
                <ChatContainer style={chatContainerStyle}>
                  <ConversationHeader>
                    <ConversationHeader.Content
                      userName={<AppTitle title={title} isValid={isValid} isDeployed={isDeployed} />}
                      info={info}
                    />
                    <ConversationHeader.Actions>
                      <AddUserButton onClick={handleAddUserButtonClick} title="Start a new chat" />
                      {toggleMetadata && <InfoButton onClick={handleInfoButtonClick} title="Toggle system meta data" />}
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
          </ComponentLayout>
        </ContentLayout>
      </ContainerLayout>
    </div>
  );
}

export default SmarterChat;
