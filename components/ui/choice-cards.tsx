import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Choice = { value: string; label: ReactNode; description?: ReactNode };
export type ChoiceGroup = { label: string; choices: Choice[] };

/**
 * Radio buttons or checkboxes shown as selectable cards, each with a short explanation,
 * so people can see every option at once instead of opening a drop-down.
 */
export function ChoiceCards({
  name,
  legend,
  hint,
  error,
  type = "radio",
  choices,
  groups,
  defaultValue,
  columns = 2,
  required,
}: {
  name: string;
  legend: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  type?: "radio" | "checkbox";
  choices?: Choice[];
  /** Alternative to `choices`: options under small subheadings. */
  groups?: ChoiceGroup[];
  defaultValue?: string | string[];
  columns?: 1 | 2;
  required?: boolean;
}) {
  const selected = new Set(Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []);
  const all = groups ?? [{ label: "", choices: choices ?? [] }];

  return (
    <fieldset className="mt-5 min-w-0" aria-invalid={error ? true : undefined}>
      <legend className="mb-1 font-sans text-sm font-bold">{legend}</legend>
      {hint && <p className="mb-2 text-sm text-ink-subtle">{hint}</p>}
      {all.map((group) => (
        <div key={group.label} className="mt-2">
          {group.label && <p className="mb-1.5 text-sm text-ink-muted italic">{group.label}</p>}
          <div className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
            {group.choices.map((c) => (
              <label
                key={c.value}
                className={cn(
                  "flex cursor-pointer gap-2.5 rounded border border-rule-strong bg-paper px-3 py-2.5 transition",
                  "hover:border-ink has-checked:border-brand has-checked:bg-brand-tint has-focus-visible:outline-2 has-focus-visible:outline-brand",
                )}
              >
                <input
                  type={type}
                  name={name}
                  value={c.value}
                  defaultChecked={selected.has(c.value)}
                  required={required && type === "radio"}
                  className="mt-1.5 self-start accent-brand-strong"
                />
                <span className="min-w-0">
                  <span className="block font-bold leading-snug">{c.label}</span>
                  {c.description && <span className="mt-0.5 block text-sm text-ink-muted">{c.description}</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {error && <p className="mt-1.5 text-sm text-brand">{error}</p>}
    </fieldset>
  );
}
