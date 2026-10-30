import { z } from "zod";

/** What every submission action returns to its form (via useActionState). */
export type FormState = {
  status: "idle" | "error" | "success";
  /** Form-level message, e.g. "Please sign in". */
  message?: string;
  /** Field-level messages, keyed by input name. */
  errors?: Record<string, string[] | undefined>;
  /** The submitted values, so the form can show them again after an error. */
  values?: Record<string, string | string[]>;
};

export const initialFormState: FormState = { status: "idle" };

/**
 * FormData → plain object. Fields that occur more than once (checkboxes) become arrays.
 * Browsers submit textarea line breaks as CRLF; they are normalized to LF here.
 */
export function readForm(formData: FormData): Record<string, string | string[]> {
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = formData
      .getAll(key)
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.replace(/\r\n?/g, "\n"));
    values[key] = all.length > 1 || key.endsWith("[]") ? all : (all[0] ?? "");
  }
  return values;
}

export function invalid(error: z.ZodError, values: FormState["values"]): FormState {
  return {
    status: "error",
    message: "Please check the highlighted fields.",
    errors: z.flattenError(error).fieldErrors as FormState["errors"],
    values,
  };
}

/** Value to show in a field after a failed submission. */
export function valueOf(state: FormState, name: string, fallback = ""): string {
  const v = state.values?.[name];
  return typeof v === "string" ? v : fallback;
}

export function valuesOf(state: FormState, name: string, fallback: string[] = []): string[] {
  const v = state.values?.[name];
  return Array.isArray(v) ? v : typeof v === "string" && v ? [v] : fallback;
}

export function errorOf(state: FormState, name: string): string | undefined {
  return state.errors?.[name]?.[0];
}
