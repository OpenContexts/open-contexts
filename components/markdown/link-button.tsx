"use client";

import { type RefObject, useId, useState } from "react";
import { LinkIcon } from "@/components/ui";
import { DialogError, DialogField, EditorDialog, insertMarkdown, ToolButton, useCursor } from "./editor-tools";

/**
 * What was typed as an address, as a full one: "arxiv.org/abs/…" gets https://, an email address mailto:. Only web
 * and email addresses; undefined for anything else.
 */
export function webAddress(input: string): string | undefined {
  const typed = input.trim();
  if (!typed || /\s/.test(typed)) return undefined;
  const full = /^[^@/:]+@[^@/:]+\.[a-z]{2,}$/i.test(typed)
    ? `mailto:${typed}`
    : /^[a-z][a-z\d+.-]*:/i.test(typed)
      ? typed
      : /^[^/?#]+\.[a-z]{2,}(:\d+)?([/?#]|$)/i.test(typed)
        ? `https://${typed}`
        : undefined;
  if (!full || !URL.canParse(full)) return undefined;
  return ["http:", "https:", "mailto:"].includes(new URL(full).protocol) ? full : undefined;
}

/**
 * The markdown for a link: [text](address), or <address> without a text. Brackets in the text, and parentheses and
 * angle brackets in the address, would end them early.
 */
export function linkMarkdown(text: string, address: string): string {
  const target = address.replace(/[()<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const label = text.replace(/\s+/g, " ").trim().replace(/[[\]]/g, "\\$&");
  return label ? `[${label}](${target})` : `<${target}>`;
}

/**
 * The "Link" button above a markdown editor: asks for an address and the text to show, and puts the link into the
 * text, in place of what is selected (which becomes the link's text). `admin`: the dashboard's colours.
 */
export function LinkButton({ textarea, admin }: { textarea: RefObject<HTMLTextAreaElement | null>; admin?: boolean }) {
  const cursor = useCursor(textarea);
  const [place, setPlace] = useState<ReturnType<typeof cursor>>();
  return (
    <>
      <ToolButton
        admin={admin}
        icon={<LinkIcon className="size-3.5" />}
        onClick={() => {
          // A selection of one line becomes the link's text; a longer one is kept, and the link goes after it.
          const at = cursor();
          setPlace(at?.selected.includes("\n") ? { start: at.end, end: at.end, selected: "" } : at);
        }}
      >
        Link
      </ToolButton>
      {place && (
        <LinkDialog
          admin={admin}
          selected={place.selected}
          onClose={() => setPlace(undefined)}
          onInsert={(markdown) => {
            if (textarea.current) insertMarkdown(textarea.current, markdown, place);
            setPlace(undefined);
          }}
        />
      )}
    </>
  );
}

function LinkDialog({ admin, selected, onClose, onInsert }: { admin?: boolean; selected: string; onClose: () => void; onInsert: (markdown: string) => void }) {
  const id = useId();
  const [text, setText] = useState(selected);
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string>();

  const insert = () => {
    const full = webAddress(address);
    if (!full) return setError("Please enter a web address or an email address.");
    onInsert(linkMarkdown(text, full));
  };

  return (
    <EditorDialog admin={admin} title="Add a link" onClose={onClose} confirm={{ label: "Insert link", disabled: !address.trim(), onClick: insert }}>
      <DialogField
        admin={admin}
        id={`${id}-address`}
        label="Address"
        type="url"
        inputMode="url"
        value={address}
        onChange={(e) => {
          setAddress(e.currentTarget.value);
          setError(undefined);
        }}
        onEnter={insert}
        placeholder="https://…"
        autoFocus
        aria-invalid={!!error || undefined}
      />
      <DialogField
        admin={admin}
        id={`${id}-text`}
        label="Text"
        hint="What the link reads as. Without it, the address itself is shown."
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onEnter={insert}
        placeholder="e.g. the original paper"
      />
      {error && <DialogError admin={admin}>{error}</DialogError>}
    </EditorDialog>
  );
}
