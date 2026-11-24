"use client";

import { type DragEvent, type RefObject, useEffect, useId, useRef, useState } from "react";
import { ImageIcon, Spinner } from "@/components/ui";
import { uploadImage } from "@/lib/actions/uploads";
import { cn } from "@/lib/cn";
import { IMAGE_MAX_INPUT_BYTES, IMAGE_MAX_SIDE, IMAGE_TARGET_BYTES, IMAGE_TYPES, imageMarkdown } from "@/lib/images";
import { type Compressed, compressImage } from "./compress-image";
import { DialogError, DialogField, EditorDialog, insertMarkdown, ToolButton, useCursor } from "./editor-tools";

const kB = (bytes: number) => `${Math.round(bytes / 1000).toLocaleString("en")} kB`;

/**
 * The "Image" button above a markdown editor: opens a dialog to choose an image, which is compressed, uploaded and
 * put into the text as ![description](url), on a line of its own. `admin`: the dashboard's colours.
 */
export function ImageButton({ textarea, admin }: { textarea: RefObject<HTMLTextAreaElement | null>; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const cursor = useCursor(textarea);
  return (
    <>
      <ToolButton admin={admin} icon={<ImageIcon className="size-3.5" />} onClick={() => setOpen(true)}>
        Image
      </ToolButton>
      {open && (
        <ImageDialog
          admin={admin}
          onClose={() => setOpen(false)}
          onInsert={(markdown) => {
            const place = cursor();
            if (textarea.current && place) insertMarkdown(textarea.current, markdown, place, true);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

type Phase = "choose" | "compressing" | "ready" | "uploading";

function ImageDialog({ admin, onClose, onInsert }: { admin?: boolean; onClose: () => void; onInsert: (markdown: string) => void }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>("choose");
  const [image, setImage] = useState<Compressed & { preview: string }>();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  // The file being compressed, so that choosing another meanwhile drops the first.
  const latest = useRef<File>(undefined);
  // Closed while uploading: the image is then not put into the text.
  const closed = useRef(false);

  useEffect(() => () => image && URL.revokeObjectURL(image.preview), [image]);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    latest.current = file;
    setError(undefined);
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > IMAGE_MAX_INPUT_BYTES) return setError(`This file is very large (${kB(file.size)}). Please choose a smaller one.`);
    setPhase("compressing");
    try {
      const compressed = await compressImage(file);
      if (latest.current !== file) return;
      setImage({ ...compressed, preview: URL.createObjectURL(compressed.blob) });
      setPhase("ready");
    } catch (e) {
      if (latest.current !== file) return;
      setError(e instanceof Error ? e.message : "This image could not be read.");
      setPhase(image ? "ready" : "choose");
    }
  };

  const insert = async () => {
    if (!image) return;
    setPhase("uploading");
    setError(undefined);
    const form = new FormData();
    form.append("image", new File([image.blob], `image.${IMAGE_TYPES[image.type]}`, { type: image.type }));
    try {
      const result = await uploadImage(form);
      if (result.error !== undefined) {
        setError(result.error);
        setPhase("ready");
      } else if (!closed.current) onInsert(imageMarkdown(result.url, description));
    } catch {
      setError("The image could not be uploaded. Please check your connection and try again.");
      setPhase("ready");
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (phase !== "uploading") choose(e.dataTransfer.files[0]);
  };

  return (
    <EditorDialog
      admin={admin}
      title="Add an image"
      onClose={() => {
        closed.current = true;
        onClose();
      }}
      confirm={{ label: phase === "uploading" ? "Uploading…" : "Insert image", disabled: phase !== "ready", onClick: insert }}
    >
      <label
        htmlFor={`${id}-file`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed p-3 text-center text-sm",
          admin ? "border-zinc-300 text-zinc-500" : "border-rule-strong text-ink-subtle",
          dragging && (admin ? "border-zinc-900 bg-zinc-50" : "border-ink bg-surface"),
        )}
      >
        {phase === "compressing" ? (
          <>
            <Spinner label="Compressing" />
            Compressing…
          </>
        ) : image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (blob: URL), which next/image cannot load */}
            <img src={image.preview} alt="" className="max-h-48 max-w-full object-contain" />
            <span className="text-xs">
              {image.width} × {image.height} px · {kB(image.blob.size)} · click or drop to choose another
            </span>
          </>
        ) : (
          <>
            <ImageIcon className="size-6" />
            <span>
              <span className={cn("font-bold", admin ? "text-zinc-900" : "text-ink")}>Choose an image</span> or drop it here
            </span>
          </>
        )}
        <input
          id={`${id}-file`}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={phase === "uploading"}
          onChange={(e) => {
            choose(e.currentTarget.files?.[0]);
            e.currentTarget.value = ""; // so choosing the same file again still counts
          }}
        />
      </label>

      <DialogField
        admin={admin}
        id={`${id}-description`}
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        onEnter={() => phase === "ready" && insert()}
        placeholder="Image description and placeholder"
      />
      {error && <DialogError admin={admin}>{error}</DialogError>}
    </EditorDialog>
  );
}
