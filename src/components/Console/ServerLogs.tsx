/**
 * The Console's "Server Logs" tab: the user's server logs, as they stream in.
 *
 * The records are displayed as the Smarter web console's log viewer displays them: their text, with
 * its ANSI colors, in the viewer's palette and font. Their text already has their time and level.
 * Long lines scroll horizontally, unless the user wraps them.
 */
import { ansiCss, parseAnsi } from "../../lib/ansi";
import { useLogWrap } from "../../lib/layout";
import type { LogEvent } from "../../lib/logStream";

interface ServerLogsProps {
  logs: LogEvent[];
  connected: boolean;
  error: string | null;
}

// the stream's own status messages, which older records in its history may have. As in the log viewer.
const SUPPRESSED_LINES = new Set(["Waiting for log stream...", "[stream] connected"]);

function status({ logs, connected, error }: ServerLogsProps): string {
  if (error) return error;
  if (!connected) return "Connecting to the server log stream...";
  return logs.length > 0 ? "Streaming server logs..." : "Streaming server logs... There are none yet.";
}

function LogLine({ message }: { message: string }) {
  return (
    <div className="console-log-line">
      {parseAnsi(message).map((segment, index) => (
        <span key={index} style={ansiCss(segment.style)}>
          {segment.text}
        </span>
      ))}
    </div>
  );
}

function ServerLogs(props: ServerLogsProps) {
  const [wrap, setWrap] = useLogWrap();
  const messages = props.logs
    .map((log) => String(log.message ?? ""))
    .filter((line) => !SUPPRESSED_LINES.has(line.trim()));
  return (
    <div className={`console-server-logs ${wrap ? "console-server-logs-wrap" : ""}`}>
      <div className="console-server-logs-toolbar">
        <p className="mb-0 console-server-logs-status">{status(props)}</p>
        <button
          type="button"
          className="console-server-logs-wrap-toggle"
          aria-pressed={wrap}
          title={wrap ? "Scroll long lines" : "Wrap long lines"}
          onClick={() => setWrap((previous) => !previous)}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor">
            <path d="M1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5Zm0 4a.5.5 0 0 1 .5-.5h11a2.5 2.5 0 0 1 0 5H9.707l.647.646a.5.5 0 0 1-.708.708l-1.5-1.5a.5.5 0 0 1 0-.708l1.5-1.5a.5.5 0 1 1 .708.708L9.707 11H12.5a1.5 1.5 0 0 0 0-3h-11a.5.5 0 0 1-.5-.5Zm0 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5Z" />
          </svg>
          Wrap lines
        </button>
      </div>
      <div className="console-server-logs-lines">
        {messages.map((message, index) => (
          <LogLine key={index} message={message} />
        ))}
      </div>
    </div>
  );
}

export default ServerLogs;
