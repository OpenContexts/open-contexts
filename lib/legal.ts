// The details the legal notice (/legal-notice, § 5 DDG) and the privacy policy (/privacy, Art. 13 GDPR) are
// built from. Plain values only. An empty value shows on both pages as a red "to be filled in" mark, so a
// missing detail is seen before the site goes live.
import { SITE } from "@/lib/site";

export type PostalAddress = {
  /** Street and number. */
  street: string;
  /** Postcode and town, e.g. "89081 Ulm". */
  city: string;
  country: string;
};

export const LEGAL: {
  operator: { name: string; address: PostalAddress; email: string; phone: string };
  editor: { name: string; address: PostalAddress };
  privacyUpdated: string;
} = {
  /**
   * Who runs the site and is responsible for it under data protection law: a person's name, or an
   * institution's if it runs the site officially (then also its legal form and who represents it).
   */
  operator: {
    name: "Institut für Theoretische Physik, c.o. Rafael Wagner",
    /** A postal address where letters reach the operator. */
    address: { street: "Albert-Einstein Allee 11", city: "89081 Ulm", country: "Germany" },
    email: SITE.contact,
    /** A second quick way to reach the operator, besides email; a phone number is the usual one. */
    phone: "+49 73150 22931",
  },
  /** For the blog and the edited problem pages (§ 18 Abs. 2 MStV): the person responsible for their content. Empty: the operator. */
  editor: { name: "", address: { street: "", city: "", country: "Germany" } },
  /** When the privacy policy last changed, "YYYY-MM-DD". */
  privacyUpdated: "2026-11-22",
};

/** The person responsible for the content, with an address: the editor if one is named, otherwise the operator. */
export const responsibleForContent = () => (LEGAL.editor.name ? LEGAL.editor : LEGAL.operator);
