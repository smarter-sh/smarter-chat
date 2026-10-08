/**
 * The Console: a simulated terminal beside the chat, which displays the LLMClient's configuration,
 * and the chat session's api calls, tool calls and plugin usage, as JSON, and optionally the
 * user's server logs, as they stream in.
 */
import { useEffect, useRef, useState } from "react";
import ReactJsonView from "@microlink/react-json-view";

import { useLogStream } from "../../lib/logStream";
import { consoleData, type ConsoleConfig } from "./data";
import { MenuItems, type MenuItem } from "./enums";
import ServerLogs from "./ServerLogs";
import "./styles.css";

interface ConsoleProps {
  /** The LLMClient's configuration, from its config api. Empty until it loads. */
  config: ConsoleConfig;
  /** The url of the user's server log stream. Without it, there is no "Server Logs" tab. */
  logStreamUrl?: string | null;
  /** Changes when a new chat session starts, which clears the server logs. */
  resetKey?: number | string;
}

const MENU: { label: string; id: MenuItem }[] = [
  { label: "Api Calls", id: MenuItems.LLMCLIENT_REQUEST_HISTORY },
  { label: "Tool Calls", id: MenuItems.CHAT_TOOL_CALL_HISTORY },
  { label: "Plugin Usage", id: MenuItems.CHAT_PLUGIN_USAGE_HISTORY },
  { label: "Config", id: MenuItems.CHAT_CONFIG },
];
const SERVER_LOGS = { label: "Server Logs", id: MenuItems.SERVER_LOGS };

function Console({ config, logStreamUrl = null, resetKey }: ConsoleProps) {
  // the server logs, when there are any, are first, and selected. Their stream stays connected,
  // so that the logs keep arriving while another tab is selected.
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem>(
    logStreamUrl ? MenuItems.SERVER_LOGS : MenuItems.CHAT_CONFIG,
  );
  const { clear: clearLogs, ...logStream } = useLogStream(logStreamUrl);
  const previousResetKey = useRef(resetKey);

  useEffect(() => {
    // a new chat session: its server logs start empty.
    if (resetKey === previousResetKey.current) return;
    previousResetKey.current = resetKey;
    clearLogs();
  }, [resetKey, clearLogs]);
  const menu = logStreamUrl ? [SERVER_LOGS, ...MENU] : MENU;
  const showLogs = selectedMenuItem === MenuItems.SERVER_LOGS && !!logStreamUrl;
  const selectedLabel = menu.find(({ id }) => id === selectedMenuItem)?.label ?? "";

  // a simulated bash shell.
  const [shell] = useState(() => ({
    lastLogin: new Date().toString(),
    ipAddress: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    prompt: `smarter_user@smarter-${Math.floor(Math.random() * 0xffffffff).toString(16)}:~/smarter$`,
  }));

  const data = consoleData(config, selectedMenuItem);
  const isEmpty = !showLogs && data.length === 0 && !!config && Object.keys(config).length > 0;

  return (
    <div className="console">
      <div className="app-main flex-column flex-row-fluid" id="chatapp_console_app_main">
        <div className="d-flex flex-column flex-column-fluid">
          <div id="chatapp_console_app_content" className="app-content flex-column-fluid p-0 pb-5">
            <div id="chatapp_console_app_content_container" className="app-container container-lg">
              <nav
                id="chatapp_console"
                aria-label="Console"
                className="bg-gray-200 d-flex flex-stack flex-wrap mb-2 p-2 console-nav-items"
              >
                <ul className="nav flex-wrap border-transparent">
                  {menu.map(({ label, id }) => (
                    <li className="nav-item my-1" key={id}>
                      <button
                        type="button"
                        id={id}
                        aria-pressed={id === selectedMenuItem}
                        className={`btn btn-sm btn-color-gray-600 bg-state-body btn-active-color-gray-800 fw-bolder fw-bold fs-6 fs-lg-base nav-link px-3 px-lg-4 mx-1 ${
                          id === selectedMenuItem ? "active" : ""
                        }`}
                        onClick={() => setSelectedMenuItem(id)}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
              <div
                className={`console-output rounded ${showLogs ? "console-output-logs" : ""}`}
                role="log"
                aria-label="Console output"
              >
                <div className="console-output-content">
                  <p className="mb-0">
                    Last login: {shell.lastLogin} from {shell.ipAddress}
                  </p>
                  <p className="mb-0">{shell.prompt}</p>
                  {showLogs && <ServerLogs {...logStream} />}
                  {isEmpty && (
                    <p className="mb-0 console-empty">No {selectedLabel.toLowerCase()} in this chat session yet.</p>
                  )}
                  {data.length > 0 && (
                    <>
                      {data.map((item, index) => (
                        <ReactJsonView key={index} src={item} theme="monokai" />
                      ))}
                      <p className="mb-0">{shell.prompt}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Console;
