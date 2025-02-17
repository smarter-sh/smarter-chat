export const ROOT_DOMAIN = "smarter.sh";
export const API_DOMAIN = "api." + ROOT_DOMAIN;
export const CDN_HOST_BASE_URL = "https://cdn.platform." + API_DOMAIN + "/ui-chat/";
export const SMARTER_PLATFORM_BASE_URL = "https://platform." + API_DOMAIN + "/";
export const CHATBOT_API_URL = "https://smarter.3141-5926-5359." + API_DOMAIN;
export const REACT_ROOT_ELEMENT_ID = "smarter-sh-v1-ui-chat-root";
export const DEBUG_MODE = true;

/*
creates a new URL object from the current script's src attribute.
example: https://cdn.platform.smarter.sh/ui-chat/index.html
*/
export function deriveCdnUrl(filename) {
  const indexUrl = new URL(filename, CDN_HOST_BASE_URL);
  return url.toString();
}
