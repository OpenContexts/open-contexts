import Link from "next/link";
import { Suspense } from "react";
import { AppleIcon, Container } from "@/components/ui";
import { SITE } from "@/lib/site";
import { MobileNav } from "./mobile-nav";
import { NavLinkList, NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

/** On small screens the links move into a burger menu at the left; the account menu stays at the right. */
export function SiteHeader() {
  const links = (
    <Suspense fallback={<NavLinkList />}>
      <NavLinks />
    </Suspense>
  );
  return (
    <header className="relative border-b border-ink">
      <Container className="flex items-center gap-x-6 py-2">
        <MobileNav>{links}</MobileNav>
        <Link href="/" className="flex items-baseline gap-1.5 text-[1.15rem] font-bold text-ink hover:text-brand">
          <AppleIcon />
          {SITE.name}
        </Link>
        <nav aria-label="Main" className="ml-auto flex gap-x-6 text-base max-[880px]:hidden">
          {links}
        </nav>
        {/* Fixed-width slot: the session streams in here without moving the links. */}
        <div className="w-24 text-right text-base whitespace-nowrap max-[880px]:ml-auto min-[880px]:border-l min-[880px]:border-rule min-[880px]:pl-4">
          <Suspense fallback={<span className="invisible">Sign in</span>}>
            <UserMenu />
          </Suspense>
        </div>
      </Container>
    </header>
  );
}
