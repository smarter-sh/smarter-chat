import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeEventSource, installFakes } from "@/mocks/fakes";
import { LOG_STREAM_URL, bulkLogs, liveLog } from "@/mocks/fixtures";

import { MAX_LOG_EVENTS, useLogStream } from "./logStream";

describe("useLogStream", () => {
  beforeEach(() => installFakes());
  afterEach(() => vi.unstubAllGlobals());

  it("does not connect without a url", () => {
    renderHook(() => useLogStream(null));
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it("connects with the browser's cookies, and receives the recent logs, then each new one", () => {
    const { result } = renderHook(() => useLogStream(LOG_STREAM_URL));
    const stream = FakeEventSource.latest();
    expect(stream.url).toBe(LOG_STREAM_URL);
    expect(stream.init).toEqual({ withCredentials: true });
    expect(result.current).toMatchObject({ connected: false, logs: [] });

    act(() => stream.open());
    expect(result.current.connected).toBe(true);

    act(() => stream.emit(bulkLogs, "bulk"));
    expect(result.current.logs).toEqual(bulkLogs);

    act(() => stream.emit(liveLog));
    expect(result.current.logs).toEqual([...bulkLogs, liveLog]);
  });

  it("accepts records that are plain text, and ignores a malformed history", () => {
    const { result } = renderHook(() => useLogStream(LOG_STREAM_URL));
    act(() => FakeEventSource.latest().emit("{not json", "bulk"));
    act(() => FakeEventSource.latest().emit("plain text line"));
    act(() => FakeEventSource.latest().emit({ no: "message" }));
    expect(result.current.logs).toEqual([{ message: "plain text line" }, { message: '{"no":"message"}' }]);
  });

  it("keeps only the most recent records", () => {
    const { result } = renderHook(() => useLogStream(LOG_STREAM_URL));
    const records = Array.from({ length: MAX_LOG_EVENTS + 1 }, (_, index) => ({ message: `log ${index}` }));
    act(() => FakeEventSource.latest().emit(records, "bulk"));
    expect(result.current.logs).toHaveLength(MAX_LOG_EVENTS);
    act(() => FakeEventSource.latest().emit({ message: "newest" }));
    expect(result.current.logs).toHaveLength(MAX_LOG_EVENTS);
    expect(result.current.logs.at(-1)).toEqual({ message: "newest" });
    expect(result.current.logs[0]).toEqual({ message: "log 2" });
  });

  it("reports a disconnection", () => {
    const { result } = renderHook(() => useLogStream(LOG_STREAM_URL));
    act(() => FakeEventSource.latest().open());
    act(() => FakeEventSource.latest().fail());
    expect(result.current).toMatchObject({ connected: false, error: "The log stream disconnected. Reconnecting..." });
  });

  it("closes the stream when it is unmounted", () => {
    const { unmount } = renderHook(() => useLogStream(LOG_STREAM_URL));
    unmount();
    expect(FakeEventSource.latest().closed).toBe(true);
  });
});
