import { MessageDirectionEnum, SenderRoleEnum, ValidMessageRolesEnum } from "../src/components/enums.js";

declare module "@smarter.sh/ui-chat" {
  export interface SmarterChatProps {
    apiUrl: string;
    apiKey: string;
    toggleMetadata: boolean;
    csrfCookieName: string;
    debugCookieName: string;
    debugCookieExpiration: number;
    sessionCookieName: string;
    sessionCookieExpiration: number;
  }

  export { MessageDirectionEnum, SenderRoleEnum, ValidMessageRolesEnum };
}
