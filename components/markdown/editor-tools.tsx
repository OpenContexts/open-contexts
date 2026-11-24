"use client";

// What the buttons above a markdown editor share (image-upload.tsx, link-button.tsx): the button, the dialog it
// opens, and putting their markdown into the text. `admin`: the dashboard's colours.
import { type ComponentProps, type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AdminButton, AdminInput } from "@/components/admin/ui";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Whether the text has had the cursor in it. If it has, what a button adds goes there; if not, at the end, since
 * a text that was never focused reports its cursor at the start.
 */
export function useCursor(textarea: RefObject<HTMLTextAreaElement | null>) {
  const focused = useRef(false);
  useEffect(() => {
    const el = textarea.current;
    const onFocus = () => (focused.current = true);
    el?.addEventListener("focus", onFocus);
    return () => el?.removeEventListener("focus", onFocus);
  }, [textarea]);
  /** The selected text, or the place where text would go. */
  return () => {
    const el = textarea.current;
    if (!el) return undefined;
    const [start, end] = focused.current ? [el.selectionStart, el.selectionEnd] : [el.value.length, el.value.length];
    return { start, end, selected: el.value.slice(start, end) };
  };
}

/**
 * Puts `markdown` in place of the text from `start` to `end`. `block`: on a line of its own, with a blank line
 * before and after; otherwise in the line, after a space if it would touch a word. Announced as typing, so the
 * editor's preview and counter follow.
 */
export function insertMarkdown(textarea: HTMLTextAreaElement, markdown: string, { start, end }: { start: number; end: number }, block = false) {
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const lead = block ? (!before || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n") : /\S$/.test(before) && start === end ? " " : "";
  const trail = block ? (!after || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n") : "";
  textarea.focus();
  textarea.setRangeText(lead + markdown + trail, start, end, "end");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

/** A button in the row above the editor, next to Write and Preview. */
export function ToolButton({ admin, icon, children, onClick }: { admin?: boolean; icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1 text-xs",
        admin ? "rounded px-2 py-0.5 text-zinc-500 hover:text-zinc-900" : "border-b-2 border-transparent px-1 pb-0.5 font-sans font-bold text-ink-subtle hover:text-ink",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * A modal dialog with Cancel and a button that confirms. It is put in the page's body, outside the form the editor
 * is in, so that Enter in the dialog does not send that form. `onClose`: when it closes, whether by Cancel, Escape or
 * after confirming.
 */
export function EditorDialog({
  admin,
  title,
  onClose,
  confirm,
  children,
}: {
  admin?: boolean;
  title: ReactNode;
  onClose: () => void;
  confirm: { label: ReactNode; disabled?: boolean; onClick: () => void };
  children: ReactNode;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const Btn = admin ? AdminButton : Button;
  return createPortal(
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      className={cn(
        "m-auto w-full max-w-md p-5 text-left shadow-xl backdrop:bg-black/40",
        admin ? "rounded-lg bg-white font-ui text-sm text-zinc-900 ring-1 ring-zinc-200" : "rounded-sm border border-rule bg-paper text-ink",
      )}
    >
      <h2 id={`${id}-title`} className={admin ? "text-base font-semibold" : "font-sans text-base font-bold"}>
        {title}
      </h2>
      {children}
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant={admin ? "secondary" : "ghost"} size={admin ? "md" : "sm"} onClick={() => dialog.current?.close()}>
          Cancel
        </Btn>
        <Btn variant="primary" size={admin ? "md" : "sm"} disabled={confirm.disabled} onClick={confirm.onClick}>
          {confirm.label}
        </Btn>
      </div>
    </dialog>,
    document.body,
  );
}

/** A labelled text field in a dialog. `onEnter`: what Enter does in it, as the dialog has no form to send. */
export function DialogField({
  admin,
  id,
  label,
  hint,
  onEnter,
  ...props
}: { admin?: boolean; id: string; label: ReactNode; hint?: ReactNode; onEnter: () => void } & Omit<ComponentProps<"input">, "id">) {
  const TextInput = admin ? AdminInput : Input;
  return (
    <>
      <label htmlFor={id} className={cn("mt-4 mb-1 block", admin ? "text-xs font-medium text-zinc-700" : "font-sans text-sm font-bold")}>
        {label}
      </label>
      <TextInput
        id={id}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        className={admin ? "w-full" : undefined}
        {...props}
      />
      {hint && <p className={cn("mt-1 text-xs", admin ? "text-zinc-500" : "text-ink-subtle")}>{hint}</p>}
    </>
  );
}

/** A message in a dialog: what went wrong. */
export function DialogError({ admin, children }: { admin?: boolean; children: ReactNode }) {
  return (
    <p role="alert" className={cn("mt-3 text-sm", admin ? "text-red-600" : "text-brand")}>
      {children}
    </p>
  );
}
