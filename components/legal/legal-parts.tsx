// Pieces of the legal notice and the privacy policy, built from LEGAL (lib/legal.ts).
import type { ReactNode } from "react";
import type { PostalAddress } from "@/lib/legal";

/** The value, or a red mark saying what is still missing. */
export function Filled({ value, missing }: { value: string; missing: string }) {
  if (value.trim()) return <>{value}</>;
  return <span className="font-sans text-sm font-bold text-brand">[to be filled in: {missing}]</span>;
}

/** A name and postal address, one line each, and whatever follows them (email, phone). */
export function Address({ name, address, children }: { name: string; address: PostalAddress; children?: ReactNode }) {
  return (
    <p>
      <Filled value={name} missing="name" />
      <br />
      <Filled value={address.street} missing="street and number" />
      <br />
      <Filled value={address.city} missing="postcode and town" />
      <br />
      {address.country}
      {children}
    </p>
  );
}
