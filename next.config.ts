import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
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
