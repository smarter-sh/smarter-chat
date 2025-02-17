import { MessageDirectionEnum, SenderRoleEnum, ValidMessageRolesEnum } from "./enums.js";

export function cookieMetaFactory(cookieName, cookieExpiration) {
  /*
  Create a cookie object.
   */
  return {
    name: cookieName,
    expiration: cookieExpiration,
  };
}

export function chatRestoreFromBackend(chat_history, last_response) {
  /*
  Rebuild the message thread from the most recently persisted chat history.
  */
  try {
    const messages = (chat_history ? chat_history : [])
      .map((chat) => {
        if (chat.role === SenderRoleEnum.USER) {
          return messageFactory(chat, chat.content, MessageDirectionEnum.OUTGOING, chat.role);
        } else if (chat.role === SenderRoleEnum.SYSTEM) {
          return messageFactory(chat, chat.content, MessageDirectionEnum.INCOMING, chat.role);
        } else if (chat.role === SenderRoleEnum.ASSISTANT) {
          return messageFactory(chat, chat.content, MessageDirectionEnum.INCOMING, chat.role);
        } else if (chat.role === SenderRoleEnum.SMARTER) {
          return messageFactory(chat, chat.content, MessageDirectionEnum.INCOMING, chat.role);
        } else if (chat.role === SenderRoleEnum.TOOL) {
          return messageFactory(chat, chat.content, MessageDirectionEnum.INCOMING, chat.role);
        }
        console.error(`chatRestoreFromBackend() Invalid role received: ${chat.role}`);
      })
      .filter((message) => message && typeof message === "object" && !Array.isArray(message));

    if (last_response?.choices?.[0]?.message?.content) {
      const last_message = last_response.choices[0].message;
      const last_message_content = last_message.content;
      messages.push(
        messageFactory(last_message, last_message_content, MessageDirectionEnum.INCOMING, SenderRoleEnum.ASSISTANT),
      );
    }

    return messages;
  } catch (error) {
    console.error(`chatRestoreFromBackend() Error occurred while restoring chat from backend: ${error}`);
    return []; // return an empty array in case of error
  }
}

const examplePrompts = (prompts) => {
  /*
  If we have no chat history, and the Application configuration includes
  example prompts, we can display them to the user to help them get started.
  */
  if (prompts.length == 0) {
    return "";
  } else
    return (
      "Some example prompts to get you started:\r\n\r\n" +
      prompts
        .map((prompt) => {
          return prompt + "\r\n";
        })
        .join("")
    );
};

export function chatIntro(welcome_message, system_role, example_prompts) {
  /*
  Generate the initial message thread for the chat window. This includes the
  welcome message, and any example prompts that are configured in the
  Application settings.
   */
  let messages = [messageFactory({}, system_role, MessageDirectionEnum.INCOMING, SenderRoleEnum.SYSTEM)];
  messages.push(messageFactory({}, welcome_message, MessageDirectionEnum.INCOMING, SenderRoleEnum.ASSISTANT));

  const examples = examplePrompts(example_prompts);
  if (examples) {
    messages.push(messageFactory({}, examples, MessageDirectionEnum.INCOMING, SenderRoleEnum.ASSISTANT));
  }

  return messages;
}

export function convertMarkdownLinksToHTML(message) {
  /*
  Convert markdown links to HTML links.
   */
  if (typeof message !== "string") {
    console.error(`convertMarkdownLinksToHTML() Expected a string but received ${typeof message}`);
    console.error("convertMarkdownLinksToHTML() broke here", message);
    return message; // or return a default value
  }

  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  return message.replace(markdownLinkRegex, '<a href="$2">$1</a>');
}

export function messageFactory(originalMessage, content, direction, sender) {
  /*
  Create a new message object.
   */
  const display = typeof content === "string" && content !== null;
  const converted_content = display ? convertMarkdownLinksToHTML(content) : content;
  const retVal = {
    message: converted_content,
    direction: direction,
    sender: sender,
    sentTime: new Date().toLocaleString(),
    display: display,
  };
  if (originalMessage) {
    retVal.originalMessage = originalMessage;
  } else {
    retVal.originalMessage = retVal;
  }
  return retVal;
}

function requestMessageFactory(message) {
  let retVal = message.originalMessage || {};
  retVal.role = message.originalMessage && message.originalMessage.role ? message.originalMessage.role : message.sender;
  retVal.content =
    message.originalMessage && message.originalMessage.message ? message.originalMessage.message : message.message;
  return retVal;
}

export function chatMessages2RequestMessages(messages) {
  /*
  Transform the chat message thread into a list of request messages for the
  backend API.
  */
  return (
    messages
      // filter out smarter messages
      .filter((message) => ValidMessageRolesEnum.includes(message.sender))
      .map((message, index) => {
        return requestMessageFactory(message);
      })
  );
}

export function chatInit(welcome_message, system_role, example_prompts, chat_id, chat_history, last_response) {
  /*
  Initialize the chat message thread. This function is called when the chat
  window is first opened, or when the chat window is restored from the
  backend.
   */

  let messages = [];
  messages = chatRestoreFromBackend(chat_history, last_response);

  if (messages.length === 0) {
    messages = chatIntro(welcome_message, system_role, example_prompts);
  }

  return messages;
}
