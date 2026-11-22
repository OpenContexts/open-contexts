"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics: page views without cookies (see the privacy policy). Sends the path only, without the
 * query, which can hold a token (the link to reset a password) or someone's search, and nothing from the admin pages.
 */
function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = new URL(event.url);
  if (url.pathname.startsWith("/admin")) return null;
  return { ...event, url: url.origin + url.pathname };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
