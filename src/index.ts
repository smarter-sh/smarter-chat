/**
 * @smarter.sh/ui-chat: the public api of the npm package. See vite.config.ts (--mode lib).
 *
 * The Smarter web console builds this package as an app instead. See main.tsx.
 */

export { default as SmarterChat } from "./components/SmarterChat";
export { default as Console } from "./components/Console";
export { MenuItems } from "./components/Console/enums";
export { MessageDirectionEnum, SenderRoleEnum, ValidMessageRolesEnum } from "./lib/enums";
export { projectVersion as version } from "./const";
export type {
  ApiMessage,
  ChatConfig,
  ChatHistory,
  ChatMessage,
  ChatMetaData,
  ChatbotConfig,
  SmarterChatProps,
} from "./types";
