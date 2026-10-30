"use client";

import { useState, useTransition } from "react";
import { refreshSiteCache } from "@/app/admin/actions";
import { AdminButton } from "@/components/admin/ui";

export function RefreshCacheButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <AdminButton
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await refreshSiteCache();
            setDone(true);
          })
        }
      >
        {pending ? "Refreshing…" : "Refresh the site"}
      </AdminButton>
      {done && !pending && <span className="text-xs text-zinc-500">Done. Every page is rebuilt on its next visit.</span>}
    </div>
  );
}
