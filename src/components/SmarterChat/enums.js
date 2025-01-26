export const MessageDirectionEnum = {
  INCOMING: "incoming",
  OUTGOING: "outgoing",
};
export const SenderRoleEnum = {
  SYSTEM: "system",
  ASSISTANT: "assistant",
  USER: "user",
  TOOL: "tool",
  SMARTER: "smarter",
};
export const ValidMessageRolesEnum = [
  SenderRoleEnum.SYSTEM,
  SenderRoleEnum.ASSISTANT,
  SenderRoleEnum.USER,
  SenderRoleEnum.TOOL,
];
