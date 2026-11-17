import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    agentUpgrade: "security",
    // Pages render in full on the server (`instant = false` in app/layout.tsx) rather than showing loading
    // states, so the dev checks for instant navigations only run where a segment asks for them.
    instantInsights: { validationLevel: "manual-warning" },
  },
  cacheComponents: true,
  // Loaded from node_modules at runtime instead of bundled: nodemailer uses Node APIs, and
  // react-email's renderer imports react-dom/server, which Next.js won't bundle into server code.
  serverExternalPackages: ["nodemailer", "@react-email/components", "@react-email/render"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
