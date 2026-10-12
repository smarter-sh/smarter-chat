/**
 * The Docs dialog: links to the technical references for prompt engineers and software engineers
 * who build LLMClients, and the applications that host them. SmarterChat opens it from its Docs
 * button, which is displayed only in sandbox mode.
 *
 * It is a modal: Escape, the close button, and a click outside of it all close it. The links open
 * in a new tab.
 */
import { useEffect, useRef } from "react";

import { DOC_LINKS, type DocLink } from "@/components/DocsDialog/data";
import "@/components/DocsDialog/styles.css";

interface DocsDialogProps {
  onClose: () => void;
  links?: DocLink[];
}

function DocsDialog({ onClose, links = DOC_LINKS }: DocsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    // a click outside of the dialog, e.g. on its backdrop, closes it.
    const handleMouseDown = (event: MouseEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [onClose]);

  return (
    <div className="smarter-chat-docs-backdrop">
      <div
        ref={dialogRef}
        className="smarter-chat-docs-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smarter-chat-docs-title"
      >
        <div className="smarter-chat-docs-header">
          <h2 id="smarter-chat-docs-title">Docs</h2>
          <button
            ref={closeRef}
            type="button"
            className="smarter-chat-docs-close"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            &times;
          </button>
        </div>
        <p className="smarter-chat-docs-intro">
          Technical references for building LLMClients, and the applications that host them.
        </p>
        <ul className="smarter-chat-docs-list">
          {links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.title}
              </a>
              <span className="smarter-chat-docs-description">{link.description}</span>
              <span className="smarter-chat-docs-url">{link.url}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default DocsDialog;
