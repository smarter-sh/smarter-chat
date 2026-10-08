/**
 * The user's server logs, as Server-Sent Events, for the Console's "Server Logs" tab.
 *
 * The stream is the one that the Smarter web console's log viewer reads: its first event is a
 * "bulk" event with the recent history, and each later event is one log record, as JSON. See
 * smarter.apps.dashboard.views.terminal_emulator.api.streams.stream_user_logs.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** A log record. Records that aren't JSON are displayed as their message. */
export interface LogEvent {
  message: string;
  level?: string;
  levelname?: string;
  timestamp?: number | string;
  logger?: string;
  [key: string]: unknown;
}

/** The most records to keep. Older records are dropped. */
export const MAX_LOG_EVENTS = 2000;

function parseLogEvent(data: string): LogEvent {
  try {
    const parsed = JSON.parse(data) as unknown;
    if (parsed && typeof parsed === "object" && "message" in parsed) return parsed as LogEvent;
  } catch {
    // plain text
  }
  return { message: data };
}

/** Whether a record was logged before the given time, in seconds, as Python's record.created is. */
function loggedBefore(log: LogEvent, time: number): boolean {
  const timestamp = typeof log.timestamp === "string" ? Number(log.timestamp) : log.timestamp;
  return typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp < time;
}

function keepRecent(logs: LogEvent[]): LogEvent[] {
  return logs.length > MAX_LOG_EVENTS ? logs.slice(logs.length - MAX_LOG_EVENTS) : logs;
}

/**
 * The log stream's records, and its connection state. Connects only while streamUrl is set.
 *
 * clear() removes the records, e.g. for a new chat session. The records that were logged before
 * then are not displayed again, even when a reconnection replays the history.
 */
export function useLogStream(streamUrl: string | null) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearedAt = useRef(0);

  const clear = useCallback(() => {
    clearedAt.current = Date.now() / 1000;
    setLogs([]);
  }, []);

  useEffect(() => {
    if (!streamUrl || typeof EventSource === "undefined") return;
    const source = new EventSource(streamUrl, { withCredentials: true });

    source.onopen = () => {
      setConnected(true);
      setError(null);
    };
    source.addEventListener("bulk", (event: MessageEvent<string>) => {
      try {
        const records = JSON.parse(event.data) as unknown;
        if (!Array.isArray(records)) return;
        const history = records.map((record) => parseLogEvent(JSON.stringify(record)));
        setLogs(keepRecent(history.filter((log) => !loggedBefore(log, clearedAt.current))));
      } catch {
        // a malformed history. Live records still arrive.
      }
    });
    source.onmessage = (event: MessageEvent<string>) => {
      const log = parseLogEvent(event.data);
      if (loggedBefore(log, clearedAt.current)) return;
      setLogs((previous) => keepRecent([...previous, log]));
    };
    source.onerror = () => {
      // the browser reconnects by itself, after the server's retry interval.
      setConnected(false);
      setError("The log stream disconnected. Reconnecting...");
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [streamUrl]);

  return { logs, connected, error, clear };
}
