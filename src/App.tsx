/**
 * Smarter Chat, as the Smarter web console's LLMClient prompt workbench renders it: the chat, with
 * the Console beside it.
 */
import SmarterChat from "@/components/SmarterChat";
import type { SmarterChatProps } from "@/types";

function App(props: SmarterChatProps) {
  return <SmarterChat showConsole {...props} />;
}

export default App;
