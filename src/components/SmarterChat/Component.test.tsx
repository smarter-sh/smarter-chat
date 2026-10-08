import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeEventSource, installFakes } from "@/mocks/fakes";
import {
  CONFIG_URL,
  LOG_STREAM_URL,
  bulkLogs,
  PROMPT_URL,
  SESSION_KEY,
  config,
  configWithImages,
  progressEvents,
  promptEventStream,
  promptResponse,
  props,
} from "@/mocks/fixtures";
import {
  chatHandlers,
  configErrorHandlers,
  historyHandlers,
  loadingHandlers,
  promptErrorHandlers,
} from "@/mocks/handlers";
import { server } from "@test/server";

import SmarterChat from "./Component";

const WELCOME = "Welcome to Stackademy! How can I help you today?";

/** Types a message into the chat's input, and sends it with Enter. */
async function send(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole("textbox", { name: "Message" }));
  await user.keyboard(`${text}{Enter}`);
}

describe("SmarterChat", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    document.cookie = "csrftoken=the-csrf-token; path=/";
  });

  it("starts a new chat session with the LLMClient's welcome message and example prompts", async () => {
    server.use(...chatHandlers);
    render(<SmarterChat {...props} />);
    expect(screen.getByText("Configuring workbench...")).toBeInTheDocument();
    expect(await screen.findByText(WELCOME)).toBeInTheDocument();
    expect(screen.getByText("Some example prompts to get you started:")).toBeInTheDocument();
    expect(screen.getByText("Do you offer any courses on AI?", { selector: "li" })).toBeInTheDocument();
    expect(screen.getByText("Stackademy v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("openai gpt-4o-mini with 1 additional plugins")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "valid" })).toBeInTheDocument();
    expect(screen.getByText("(sandbox)")).toBeInTheDocument();
  });

  it("restores a chat session from its history, with its links", async () => {
    server.use(...historyHandlers);
    render(<SmarterChat {...props} showConsole={false} />);
    const link = await screen.findByRole("link", { name: "the catalogue" });
    expect(link).toHaveAttribute("href", "https://stackademy.edu");
    expect(screen.getByText("Do you offer any courses on AI?")).toBeInTheDocument();
    expect(screen.getByText(/"course_code": "CS210"/)).toBeInTheDocument();
  });

  it("sends the thread with the user's message, and adds the response's messages", async () => {
    let body: { session_key: string; messages: { role: string; content: string }[] } | undefined;
    server.use(
      http.post(CONFIG_URL, () => HttpResponse.json({ data: config })),
      http.post(PROMPT_URL, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json(promptResponse());
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);

    await send(user, "Any courses on AI?");

    expect(await screen.findByText("We offer CS210 Artificial Intelligence, for $700.00.")).toBeInTheDocument();
    expect(screen.getByText("Smarter selected the stackademy_sql plugin.")).toBeInTheDocument();
    expect(body?.session_key).toBe(SESSION_KEY);
    expect(body?.messages.map((message) => message.role)).toEqual(["system", "assistant", "assistant", "user"]);
    expect(body?.messages.at(-1)?.content).toBe("Any courses on AI?");
  });

  it("does not send an empty message", async () => {
    const prompt = vi.fn();
    server.use(
      http.post(CONFIG_URL, () => HttpResponse.json({ data: config })),
      http.post(PROMPT_URL, () => {
        prompt();
        return HttpResponse.json(promptResponse());
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    await send(user, "   ");
    expect(prompt).not.toHaveBeenCalled();
  });

  it("displays a failed prompt's error in the thread", async () => {
    server.use(...promptErrorHandlers);
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    await send(user, "hello");
    expect(await screen.findByText("401 error: Incorrect API key provided.")).toBeInTheDocument();
  });

  it("displays a network failure in the thread", async () => {
    server.use(
      http.post(CONFIG_URL, () => HttpResponse.json({ data: config })),
      http.post(PROMPT_URL, () => HttpResponse.error()),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    await send(user, "hello");
    expect(await screen.findByText("Failed to fetch")).toBeInTheDocument();
  });

  it("hides and shows the backend's messages, in production and sandbox mode", async () => {
    server.use(...chatHandlers);
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    expect(screen.getByText(config.chatbot.default_system_role.trim())).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sandbox mode" }));
    expect(screen.queryByText(config.chatbot.default_system_role.trim())).not.toBeInTheDocument();
    expect(screen.getByText(WELCOME)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Production mode" }));
    expect(screen.getByText(config.chatbot.default_system_role.trim())).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sandbox mode" })).toBeInTheDocument();
  });

  it("has no metadata toggle unless asked for one", async () => {
    server.use(...chatHandlers);
    render(<SmarterChat {...props} toggleMetadata={false} />);
    await screen.findByText(WELCOME);
    expect(screen.queryByRole("button", { name: "Sandbox mode" })).not.toBeInTheDocument();
  });

  it("starts a new chat session without the old session's key", async () => {
    const sessionKeys: string[] = [];
    server.use(
      http.post(CONFIG_URL, async ({ request }) => {
        sessionKeys.push(((await request.json()) as { session_key: string }).session_key);
        return HttpResponse.json({ data: config });
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    await user.click(screen.getByRole("button", { name: "Start a new chat" }));
    await waitFor(() => expect(sessionKeys.length).toBeGreaterThanOrEqual(2));
    expect(sessionKeys.at(-1)).toBe("");
  });

  it("explains why the chat is unavailable when its configuration fails", async () => {
    server.use(...configErrorHandlers);
    render(<SmarterChat {...props} />);
    expect(await screen.findByText("Not found")).toBeInTheDocument();
    expect(screen.getByText("Smarter Chat is not available")).toBeInTheDocument();
  });

  it("is still configuring while the configuration loads", () => {
    server.use(...loadingHandlers);
    render(<SmarterChat {...props} />);
    expect(screen.getByText("Configuring workbench...")).toBeInTheDocument();
  });

  it("shows the Console, unless asked not to", async () => {
    server.use(...chatHandlers);
    const { unmount } = render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    expect(screen.getByRole("navigation", { name: "Console" })).toBeInTheDocument();
    unmount();

    render(<SmarterChat {...props} showConsole={false} />);
    await screen.findByText(WELCOME);
    expect(screen.queryByRole("navigation", { name: "Console" })).not.toBeInTheDocument();
  });

  it("sends an attached file's text", async () => {
    let lastMessage = "";
    server.use(
      http.post(CONFIG_URL, () =>
        HttpResponse.json({ data: { ...config, chatbot: { ...config.chatbot, app_file_attachment: true } } }),
      ),
      http.post(PROMPT_URL, async ({ request }) => {
        const body = (await request.json()) as { messages: { content: string }[] };
        lastMessage = body.messages.at(-1)!.content;
        return HttpResponse.json(promptResponse());
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    const file = new File(["print('hello')"], "hello.py", { type: "text/x-python" });
    await user.upload(screen.getByLabelText("Attach a file"), file);
    await waitFor(() => expect(lastMessage).toBe("print('hello')"));
    expect(screen.getByText("print('hello')")).toBeInTheDocument();
  });

  it("displays the prompt's progress while it runs, and replaces it with the response", async () => {
    let finish: () => void = () => {};
    server.use(
      http.post(CONFIG_URL, () => HttpResponse.json({ data: config })),
      http.post(PROMPT_URL, () => {
        const encoder = new TextEncoder();
        const [progress, result] = promptEventStream().split(": keepalive\n\n");
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(progress));
            finish = () => {
              controller.enqueue(encoder.encode(result));
              controller.close();
            };
          },
        });
        return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } });
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    await send(user, "Any courses on AI?");

    expect(await screen.findByText("Calling MCP server github: search_code")).toBeInTheDocument();
    expect(screen.getByText("Calling tool stackademy_sql")).toBeInTheDocument();
    const last = progressEvents.at(-1)!.message;
    expect(screen.getAllByText(last).length).toBeGreaterThan(0);
    expect(screen.getByText(`Stanley: ${last}`)).toBeInTheDocument();

    finish();
    expect(await screen.findByText("We offer CS210 Artificial Intelligence, for $700.00.")).toBeInTheDocument();
    expect(screen.queryByText("Calling tool stackademy_sql")).not.toBeInTheDocument();
  });

  it("does not ask for the prompt's progress unless asked to", async () => {
    let accept: string | null = null;
    server.use(
      http.post(CONFIG_URL, () => HttpResponse.json({ data: config })),
      http.post(PROMPT_URL, ({ request }) => {
        accept = request.headers.get("Accept");
        return HttpResponse.json(promptResponse());
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} streamProgress={false} />);
    await screen.findByText(WELCOME);
    await send(user, "hello");
    await screen.findByText("We offer CS210 Artificial Intelligence, for $700.00.");
    expect(accept).toBe("application/json");
  });

  it("hides the progress, but not the typing indicator's step, with the backend's messages", async () => {
    server.use(
      http.post(CONFIG_URL, () => HttpResponse.json({ data: config })),
      http.post(PROMPT_URL, () => {
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(promptEventStream().split(": keepalive")[0]));
          },
        });
        return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } });
      }),
    );
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    await user.click(screen.getByRole("button", { name: "Sandbox mode" }));
    await send(user, "hello");
    expect(await screen.findByText(`Stanley: ${progressEvents.at(-1)!.message}`)).toBeInTheDocument();
    expect(screen.queryByText("Calling tool stackademy_sql")).not.toBeInTheDocument();
  });

  it("displays markdown images, sized for their chat bubble", async () => {
    server.use(http.post(CONFIG_URL, () => HttpResponse.json({ data: configWithImages })));
    render(<SmarterChat {...props} />);
    const banner = await screen.findByRole("img", { name: "CS210 course banner" });
    expect(banner).toHaveClass("smarter-chat-image");
    // a data url, which browsers don't open, so it isn't a link.
    expect(screen.queryByRole("link", { name: "CS210 course banner" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "the catalogue" })).toHaveClass("smarter-chat-image");
    expect(screen.getByRole("link", { name: "the catalogue" })).toHaveAttribute("href", "https://stackademy.edu");
  });

  it("hides and shows the Console, and remembers it", async () => {
    server.use(...chatHandlers);
    const user = userEvent.setup();
    const { unmount } = render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    const toggle = screen.getByRole("button", { name: "Show the Console" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("separator", { name: "Resize the chat and the Console" })).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("navigation", { name: "Console" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    unmount();

    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    expect(screen.queryByRole("navigation", { name: "Console" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show the Console" }));
    expect(screen.getByRole("navigation", { name: "Console" })).toBeInTheDocument();
  });

  it("resizes the chat with the separator", async () => {
    server.use(...chatHandlers);
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    const separator = screen.getByRole("separator", { name: "Resize the chat and the Console" });
    const chat = screen.getByRole("region", { name: "Chat" });
    expect(chat).toHaveStyle({ flexBasis: "33.33%" });
    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(chat).toHaveStyle({ flexBasis: "38.33%" });
  });

  it("has no Console toggle without a Console", async () => {
    server.use(...chatHandlers);
    render(<SmarterChat {...props} showConsole={false} />);
    await screen.findByText(WELCOME);
    expect(screen.queryByRole("button", { name: "Show the Console" })).not.toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("clears the Console's server logs when a new chat starts", async () => {
    installFakes();
    server.use(...chatHandlers);
    const user = userEvent.setup();
    render(<SmarterChat {...props} logStreamUrl={LOG_STREAM_URL} />);
    await screen.findByText(WELCOME);
    const stream = FakeEventSource.latest();
    act(() => stream.open());
    act(() => stream.emit(bulkLogs, "bulk"));
    const output = screen.getByRole("log", { name: "Console output" });
    expect(output).toHaveTextContent("prompt started");

    await user.click(screen.getByRole("button", { name: "Start a new chat" }));
    await screen.findByText(WELCOME);
    expect(output).not.toHaveTextContent("prompt started");
    expect(output).toHaveTextContent("Streaming server logs... There are none yet.");
    // a reconnection replays the history, whose older records stay cleared.
    act(() => stream.emit(bulkLogs, "bulk"));
    expect(output).not.toHaveTextContent("prompt started");
    vi.unstubAllGlobals();
  });

  it("passes the log stream's url to the Console", async () => {
    installFakes();
    server.use(...chatHandlers);
    render(<SmarterChat {...props} logStreamUrl={LOG_STREAM_URL} />);
    await screen.findByText(WELCOME);
    expect(screen.getByRole("button", { name: "Server Logs" })).toHaveAttribute("aria-pressed", "true");
    expect(FakeEventSource.latest().url).toBe(LOG_STREAM_URL);
    vi.unstubAllGlobals();
  });
});
