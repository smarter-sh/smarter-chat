declare module "smarter-chat" {
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

declare module "error-modal" {
  export interface ErrorModalProps {
    isModalOpen: boolean;
    onCloseClick: () => void;
    title: string;
    message: string;
  }

  export const ErrorModal: (props: ErrorModalProps) => JSX.Element;
}
