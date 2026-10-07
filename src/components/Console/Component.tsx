/**
 * The Console: a simulated terminal beside the chat, which displays the LLMClient's configuration,
 * and the chat session's api calls, tool calls and plugin usage, as JSON.
 */
import { useState } from "react";
import ReactJsonView from "@microlink/react-json-view";

import { consoleData, type ConsoleConfig } from "./data";
import { MenuItems, type MenuItem } from "./enums";
import "./styles.css";

interface ConsoleProps {
  /** The LLMClient's configuration, from its config api. Empty until it loads. */
  config: ConsoleConfig;
}

const MENU: { label: string; id: MenuItem }[] = [
  { label: "Api Calls", id: MenuItems.LLMCLIENT_REQUEST_HISTORY },
  { label: "Tool Calls", id: MenuItems.CHAT_TOOL_CALL_HISTORY },
  { label: "Plugin Usage", id: MenuItems.CHAT_PLUGIN_USAGE_HISTORY },
  { label: "Config", id: MenuItems.CHAT_CONFIG },
];

function Console({ config }: ConsoleProps) {
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem>(MenuItems.CHAT_CONFIG);

  // a simulated bash shell.
  const [shell] = useState(() => ({
    lastLogin: new Date().toString(),
    ipAddress: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    prompt: `smarter_user@smarter-${Math.floor(Math.random() * 0xffffffff).toString(16)}:~/smarter$`,
  }));

  const data = consoleData(config, selectedMenuItem);

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
                  {MENU.map(({ label, id }) => (
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
              <div className="console-output rounded" role="log" aria-label="Console output">
                <div className="console-output-content">
                  <p className="mb-0">
                    Last login: {shell.lastLogin} from {shell.ipAddress}
                  </p>
                  <p className="mb-0">{shell.prompt}</p>
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
