import { Body, Container, Head, Hr, Html, Preview, Text } from "@react-email/components";
import type { ReactNode } from "react";

// Shared frame for all emails: plain, serif, readable everywhere. Email clients ignore
// stylesheets, so styles are inline.
export const colors = { ink: "#111111", muted: "#6e6e6e", rule: "#d9d9d9", brand: "#c00808", brandDark: "#5a0000" };

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Georgia, 'Times New Roman', serif", color: colors.ink, margin: 0 }}>
        <Container style={{ maxWidth: "32rem", padding: "32px 24px" }}>
          <Text style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 24px" }}>
            <span style={{ color: colors.brand }}>●</span> OpenContexts
          </Text>
          {children}
          <Hr style={{ borderColor: colors.rule, margin: "32px 0 16px" }} />
          <Text style={{ fontSize: "13px", color: colors.muted, margin: 0 }}>OpenContexts · Open problems in generalized contextuality</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function Paragraph({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={{ fontSize: muted ? "14px" : "16px", lineHeight: 1.5, color: muted ? colors.muted : colors.ink, margin: "0 0 16px" }}>{children}</Text>;
}
