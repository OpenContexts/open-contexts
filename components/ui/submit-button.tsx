"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

/** A submit button that disables itself and changes its label while the form is sending. */
export function SubmitButton({
  children,
  pendingLabel = "Sending…",
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
