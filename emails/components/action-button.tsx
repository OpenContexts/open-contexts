import { Button, Link, Text } from "@react-email/components";
import { colors } from "./email-layout";

/** The single call to action, with the raw link underneath for clients that block buttons. */
export function ActionButton({ href, children }: { href: string; children: string }) {
  return (
    <>
      <Button
        href={href}
        style={{
          backgroundColor: colors.brand,
          border: `1.5px solid ${colors.brandDark}`,
          borderRadius: "4px",
          color: "#ffffff",
          fontFamily: "Helvetica, Arial, sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          padding: "10px 18px",
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
      <Text style={{ fontSize: "13px", color: colors.muted, margin: "16px 0", wordBreak: "break-all" }}>
        Or open this link: <Link href={href} style={{ color: colors.brand }}>{href}</Link>
      </Text>
    </>
  );
}
