import Link from "next/link";
import { Container } from "@/components/ui";
import { NAV, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink pt-5 pb-9 text-[0.92rem] text-ink-muted">
      <Container>
        <div className="flex flex-wrap justify-between gap-x-8 gap-y-3">
          <div className="text-ink">
            <strong>{SITE.name}</strong>
            <br />
            <span>{SITE.subtitle}</span>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="text-ink hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-ink-subtle">
          Statuses are dated snapshots. Check the cited sources before relying on one.
        </p>
      </Container>
    </footer>
  );
}
