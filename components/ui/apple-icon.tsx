import { cn } from "@/lib/cn";

// The site's mark. Its colour encodes state: red = open, outline = under revision,
// grey = solved, gold = research area, white = on a red background. The outline apple is filled with the page colour.
const palettes = {
  red: { body: "#c00808", leaf: "#3f8f3f", stem: "#5a3a1a", stroke: "none" },
  outline: { body: "var(--color-paper)", leaf: "#3f8f3f", stem: "#5a3a1a", stroke: "#c00808" },
  grey: { body: "#bdbdbd", leaf: "#9c9c9c", stem: "#8a8a8a", stroke: "none" },
  gold: { body: "#e6b422", leaf: "#3f8f3f", stem: "#5a3a1a", stroke: "none" },
  white: { body: "#ffffff", leaf: "#ffffff", stem: "#ffffff", stroke: "none" },
} as const;

export type AppleVariant = keyof typeof palettes;

export function AppleIcon({ variant = "red", className, label }: { variant?: AppleVariant; className?: string; label?: string }) {
  const c = palettes[variant];
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("inline-block size-[1.05em] flex-none align-[-0.16em]", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        style={{ fill: c.body }} // a style, not the attribute: attributes can't read CSS variables
        stroke={c.stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
        d="M12 8.6C10.8 7.4 9.2 6.8 7.6 7 4.4 7.4 2.6 10.6 3.3 14.4 4 18.5 6.6 21.4 8.6 21.4c1 0 2-.6 3.4-.6s2.4.6 3.4.6c2 0 4.6-2.9 5.3-7 .7-3.8-1.1-7-4.3-7.4-1.6-.2-3.2.4-4.4 1.6z"
      />
      <path fill="none" stroke={c.stem} strokeWidth={1.7} strokeLinecap="round" d="M12 8.6c0-1.8.6-3.4 1.8-4.6" />
      <path fill={c.leaf} d="M13 6.6c.4-2 2.2-3.1 4.4-2.8-.3 2.1-2 3.3-4.4 2.8z" />
    </svg>
  );
}
