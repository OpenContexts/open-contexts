import Link from "next/link";
import { CopyButton } from "@/components/ui";
import { siteOrigin } from "@/lib/cite";
import { permalinkPath } from "@/lib/permalinks";

/**
 * "Permanent link: open-contexts.com/contribution/12.3", with a button to copy the full address. The link keeps
 * working when the page's URL changes, so it is the one to cite.
 */
export function PermanentLink({ permalink }: { permalink: string }) {
  const path = permalinkPath(permalink);
  const url = `${siteOrigin()}${path}`;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-subtle">
      Permanent link:
      <Link href={path} className="break-all text-brand hover:underline">
        {url.replace(/^https?:\/\//, "")}
      </Link>
      <CopyButton text={url} label="the permanent link" />
    </p>
  );
}
