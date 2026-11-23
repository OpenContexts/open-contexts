import { cn } from "@/lib/cn";

/** A variable in a key, set like one in a formula. */
const V = ({ children }: { children: string }) => <em className="font-serif font-normal">{children}</em>;

/**
 * The forms a permanent link key takes, with what each points to. Written with variables (n for a problem's
 * number, k for the version, contribution or post) rather than an example, which could pass for a real one.
 */
export function PermalinkKeys({ host }: { host: string }) {
  const keys = [
    { key: <V>n</V>, text: <>problem <V>n</V></> },
    { key: <><V>n</V>v<V>k</V></>, text: <>problem <V>n</V> as it read at version <V>k</V></> },
    { key: <><V>n</V>.<V>k</V></>, text: <>the <V>k</V>-th contribution to problem <V>n</V></> },
    { key: <>blog.<V>k</V></>, text: <>the <V>k</V>-th blog post</> },
  ];
  return (
    <div className="rounded-md border border-rule-strong bg-surface px-4 py-3.5">
      <p className="text-center font-mono text-[0.95rem] break-all">
        <span className="text-ink-subtle">{host}/contribution/</span>
        <span className="rounded bg-brand-tint px-1 text-brand">key</span>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {keys.map((k, i) => (
          <div key={i} className="rounded border border-rule bg-paper px-2.5 py-2 text-center">
            <dt className="font-mono text-[1.05rem] font-bold text-brand">{k.key}</dt>
            <dd className="text-sm text-ink-muted">{k.text}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-center text-sm text-ink-subtle">The links never change, and a key is never reused.</p>
    </div>
  );
}

/** The targets of the one-year assessment, fixed in advance in the companion paper: three figures on a line. */
export function AssessmentTargets({ className }: { className?: string }) {
  const targets = [
    { n: "≥ 50", text: "researchers contributed" },
    { n: "≥ 10", text: "institutions took part" },
    { n: "≥ 50 %", text: "of the problems got a submission or comment" },
  ];
  return (
    <ul className={cn("mx-auto flex max-w-170 flex-wrap justify-center gap-2", className)}>
      {targets.map((t) => (
        <li key={t.text} className="flex items-baseline gap-2 rounded-full border border-rule-strong px-3.5 py-1 text-[0.95rem]">
          <strong className="whitespace-nowrap">{t.n}</strong>
          <span className="text-ink-muted">{t.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** The case study on a line: a fixed list, a year of work, a public assessment, and what follows. */
export function CycleTimeline({ name }: { name: string }) {
  const steps = [
    { title: `${name} I`, text: "A fixed list of problems" },
    { title: "One year", text: "Work, contributions, discussion" },
    { title: "Assessment", text: "A public white paper, failures included" },
    { title: "Afterwards", text: "Revised rules, additional problems" },
  ];
  return (
    <ol className="relative grid gap-4 sm:grid-cols-4">
      <span aria-hidden className="absolute top-[0.6rem] right-[12.5%] left-[12.5%] h-px bg-rule-strong max-sm:hidden" />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
          {/* On phones the steps stack; a line runs down from each dot to the next (the gap between steps is 1rem). */}
          {i < steps.length - 1 && <span aria-hidden className="absolute top-3 left-2.5 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-rule-strong sm:hidden" />}
          <span className={cn("relative mt-0.5 size-5 flex-none rounded-full border-[1.5px] sm:mt-0", i === 0 ? "border-brand bg-brand" : "border-ink-subtle bg-paper")} />
          <span className="text-[0.95rem]/snug">
            <strong className="block">{s.title}</strong>
            <span className="text-ink-muted">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
