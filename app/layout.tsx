import type { Metadata } from "next";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SITE } from "@/lib/site";

// Computer Modern, the typeface of LaTeX (SIL Open Font License, see app/fonts/OFL.txt).
const serif = localFont({
  variable: "--font-cmu-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman", // size-matched serif fallback, so text doesn't shift when the font loads
  src: [
    { path: "./fonts/cmu-serif-500-roman.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cmu-serif-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/cmu-serif-700-roman.woff2", weight: "700", style: "normal" },
    { path: "./fonts/cmu-serif-700-italic.woff2", weight: "700", style: "italic" },
  ],
});

const sans = localFont({
  variable: "--font-cmu-sans",
  display: "swap",
  src: [
    { path: "./fonts/cmu-sans-serif-500-roman.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cmu-sans-serif-700-roman.woff2", weight: "700", style: "normal" },
  ],
});

const mono = localFont({
  variable: "--font-cmu-mono",
  display: "swap",
  src: "./fonts/cmu-typewriter-text-500-roman.woff2",
  weight: "500",
});

// Every page is rendered in full on the server before it is sent, instead of a prerendered shell with
// loading states that stream in. The data behind the pages is cached ("use cache" in lib/data and the
// problem page), so a render costs no database query unless something changed.
export const instant = false;

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
