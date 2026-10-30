import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/ui";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="absolute -left-[999px] top-2 z-10 rounded bg-brand-strong px-3 py-1.5 text-white focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Container>{children}</Container>
      </main>
      <SiteFooter />
    </>
  );
}
