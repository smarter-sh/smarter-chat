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

  export const SmarterChat: (props: SmarterChatProps) => JSX.Element;
}
