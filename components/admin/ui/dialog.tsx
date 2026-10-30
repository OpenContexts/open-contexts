"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** A modal <dialog>, opened and closed through `open`. Escape and the Cancel buttons call `onClose`. */
export function AdminDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-lg bg-white p-5 text-left font-ui text-sm text-zinc-900 shadow-xl ring-1 ring-zinc-200 backdrop:bg-zinc-900/30"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      {open && children}
    </dialog>
  );
}

/** Right-aligned buttons at the bottom of a dialog. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2">{children}</div>;
}
