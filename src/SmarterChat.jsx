import React from "react";
import { ContainerLayout, ContentLayout } from "./components/Layout";
import ChatApp from "./components/chatApp/Component";
import "./SmarterChat.css";

const SmarterChat = ({
  url,
  toggleMetadata,
  csrfCookieName,
  debugCookieName,
  debugCookieExpiration,
  sessionCookieName,
  sessionCookieExpiration,
}) => {
  return (
    <div id="smarter_chatapp_container" className="SmarterChat">
      <ContainerLayout>
        <ContentLayout>
          <ChatApp
            url={url}
            toggleMetadata={toggleMetadata}
            csrfCookieName={csrfCookieName}
            debugCookieName={debugCookieName}
            debugCookieExpiration={debugCookieExpiration}
            sessionCookieName={sessionCookieName}
            sessionCookieExpiration={sessionCookieExpiration}
          />
        </ContentLayout>
      </ContainerLayout>
    </div>
  );
};

export default SmarterChat;
