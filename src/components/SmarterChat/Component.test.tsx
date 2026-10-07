import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONFIG_URL, PROMPT_URL, SESSION_KEY, config, promptResponse, props } from "@/mocks/fixtures";
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
    expect(screen.getByText(/^Some example prompts.*Do you offer any courses on AI\?/s)).toBeInTheDocument();
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

  it("hides and shows the backend's messages", async () => {
    server.use(...chatHandlers);
    const user = userEvent.setup();
    render(<SmarterChat {...props} />);
    await screen.findByText(WELCOME);
    expect(screen.getByText(config.chatbot.default_system_role.trim())).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle system meta data" }));
    expect(screen.queryByText(config.chatbot.default_system_role.trim())).not.toBeInTheDocument();
    expect(screen.getByText(WELCOME)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Toggle system meta data" }));
    expect(screen.getByText(config.chatbot.default_system_role.trim())).toBeInTheDocument();
  });

  it("has no metadata toggle unless asked for one", async () => {
    server.use(...chatHandlers);
    render(<SmarterChat {...props} toggleMetadata={false} />);
    await screen.findByText(WELCOME);
    expect(screen.queryByRole("button", { name: "Toggle system meta data" })).not.toBeInTheDocument();
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
});
