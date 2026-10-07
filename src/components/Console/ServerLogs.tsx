/** The Console's "Server Logs" tab: the user's server logs, as they stream in. */
import type { LogEvent } from "../../lib/logStream";

interface ServerLogsProps {
  logs: LogEvent[];
  connected: boolean;
  error: string | null;
}

function level(log: LogEvent): string {
  return String(log.level ?? log.levelname ?? "").toUpperCase();
}

function status({ logs, connected, error }: ServerLogsProps): string {
  if (error) return error;
  if (!connected) return "Connecting to the server log stream...";
  return logs.length > 0 ? "Streaming server logs..." : "Streaming server logs... There are none yet.";
}

function ServerLogs(props: ServerLogsProps) {
  const { logs } = props;
  return (
    <div className="console-server-logs">
      <p className="mb-0 console-server-logs-status">{status(props)}</p>
      {logs.map((log, index) => {
        const logLevel = level(log);
        return (
          <div key={index} className={`console-log-line console-log-${logLevel.toLowerCase() || "info"}`}>
            {logLevel && <span className="console-log-level">{logLevel} </span>}
            {log.message}
          </div>
        );
      })}
    </div>
  );
}

export default ServerLogs;
