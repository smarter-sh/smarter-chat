import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import DocsDialog from "@/components/DocsDialog/Component";
import { DOC_LINKS } from "@/components/DocsDialog/data";

describe("DocsDialog", () => {
  it("lists the technical references, which open in a new tab", () => {
    render(<DocsDialog onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Docs" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(DOC_LINKS.length);
    for (const link of DOC_LINKS) {
      const anchor = screen.getByRole("link", { name: link.title });
      expect(anchor).toHaveAttribute("href", link.url);
      expect(anchor).toHaveAttribute("target", "_blank");
      expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("focuses its close button", () => {
    render(<DocsDialog onClose={() => {}} />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("closes with its close button, with Escape, and with a click outside of it", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<DocsDialog onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.click(document.body);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("lists other links", () => {
    render(
      <DocsDialog onClose={() => {}} links={[{ title: "Example", url: "https://example.com/", description: "" }]} />,
    );
    expect(screen.getByRole("link", { name: "Example" })).toHaveAttribute("href", "https://example.com/");
  });
});
