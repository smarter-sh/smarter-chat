// Set to true to enable local development mode,
// which will simulate the server-side API calls.
export const REACT_LOCAL_DEV_MODE = false;

export const MESSAGE_DIRECTION = {
  INCOMING: "incoming",
  OUTGOING: "outgoing",
};
export const SENDER_ROLE = {
  SYSTEM: "system",
  ASSISTANT: "assistant",
  USER: "user",
  TOOL: "tool",
  SMARTER: "smarter",
};
export const VALID_MESSAGE_ROLES = [
  SENDER_ROLE.SYSTEM,
  SENDER_ROLE.ASSISTANT,
  SENDER_ROLE.USER,
  SENDER_ROLE.TOOL,
];
