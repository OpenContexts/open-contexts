import type { Metadata } from "next";
import Link from "next/link";
import { Address } from "@/components/legal/legal-parts";
import { PageTitle, SectionTitle } from "@/components/ui";
import { isGitHubConfigured } from "@/lib/auth/github";
import { formatDate } from "@/lib/format";
import { LEGAL } from "@/lib/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

// The information Art. 13 GDPR asks for, for what the site actually does: hosting on Vercel, the database at
// Neon in Frankfurt, accounts (email, GitHub, ORCID) through Better Auth with Vercel BotID on the email forms,
// emails over SMTP, cookieless page statistics with Vercel Web Analytics (components/layout/analytics.tsx). Keep it in step with the code: a new service, cookie or kind of stored data
// belongs here, with a new `privacyUpdated`.
export default function PrivacyPage() {
  const { operator } = LEGAL;
  // GitHub is named only while GitHub sign-in is switched on (GITHUB_CLIENT_ID); ORCID always.
  const github = isGitHubConfigured();
  const providers = github ? "GitHub or ORCID" : "ORCID";
  const mail = <a href={`mailto:${operator.email}`}>{operator.email}</a>;
  return (
    <div className="prose-oc">
      <PageTitle>Privacy policy</PageTitle>
      <p>
        This policy explains which personal data {SITE.name} processes, why, on what legal basis, and what rights you
        have. In short: reading the site requires no account and sets no cookies; we count page views without
        cookies and without telling visitors apart over time, and use no advertising and no tracking across sites. If
        you create an account, we store what the account and
        your contributions need, and show your name with what you publish.
      </p>

      <SectionTitle>1. Who is responsible</SectionTitle>
      <p>The controller within the meaning of the General Data Protection Regulation (GDPR) is:</p>
      <Address name={operator.name} address={operator.address}>
        <br />
        Email: {mail}
      </Address>
      <p>
        For any question about your data, or to exercise your rights (section 9), write to {mail}. See also the{" "}
        <Link href="/legal-notice">legal notice</Link>.
      </p>

      <SectionTitle>2. Visiting the site</SectionTitle>
      <p>
        The site is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you open a page,
        your browser sends Vercel&apos;s servers the data any web request carries: your IP address, the date and time,
        the page requested, the referring page, and your browser and operating system (user agent). Vercel uses
        them to deliver the page, to protect the service against attacks and abuse, and keeps them in its logs for a
        short time. The legal basis is our legitimate interest in running the site securely and reliably
        (Art. 6(1)(f) GDPR).
      </p>
      <p>
        Vercel processes these data on our behalf under a data processing agreement (Art. 28 GDPR). Vercel may
        process data in the USA; it is certified under the EU–US Data Privacy Framework, on the basis of the
        European Commission&apos;s adequacy decision (Art. 45 GDPR), and its agreement also includes the EU standard
        contractual clauses (Art. 46(2)(c) GDPR).
      </p>
      <p>
        The fonts and the software that typesets mathematics are served from our own site. Pages load nothing from
        other providers, so no other provider learns that you visited them; the only additions are Vercel&apos;s
        page statistics (below) and its bot protection when you send one of the email sign-in forms (section 4).
        Links to papers and other websites lead you there only when you follow them.
      </p>
      <p>
        <strong>Page statistics.</strong> To learn which pages are read and how the site is found, we use Vercel Web
        Analytics. When a page opens, a script served from our own address sends Vercel the address of the page
        (without the part after a question mark), the referring page, and the type of browser, operating system and
        device; Vercel derives the country from your IP address. It sets no cookies and stores nothing in your
        browser. To count a visit only once, Vercel forms a pseudonymous value from the request, which it discards
        after 24 hours, so visitors cannot be recognized across days or sites. We see only totals. The legal basis
        is our legitimate interest in knowing how the site is used, to improve it (Art. 6(1)(f) GDPR); you can
        object (section 9), or block the script in your browser. Vercel processes the data on our behalf, as above.
      </p>

      <SectionTitle>3. Cookies and storage in your browser</SectionTitle>
      <p>We use no cookies for statistics, advertising or tracking, and so ask for no consent to them. We only use:</p>
      <ul>
        <li>
          a <strong>session cookie</strong> once you sign in, which keeps you signed in. It holds a random token and
          expires after seven days without a visit, or when you sign out;
        </li>
        <li>
          during sign-in with {providers}, a <strong>short-lived cookie</strong> that ties the provider&apos;s
          answer to your sign-in, to protect it against forgery;
        </li>
        <li>
          your choice of <strong>light or dark appearance</strong>, kept in your browser&apos;s local storage only if
          you change it, and never sent to us.
        </li>
      </ul>
      <p>
        All three are strictly necessary for a service you asked for (§ 25(2) no. 2 TDDDG). The session cookie and
        the sign-in cookie serve to perform the account you created (Art. 6(1)(b) GDPR).
      </p>

      <SectionTitle>4. Your account</SectionTitle>
      <p>Reading the site needs no account. To contribute, you create one, and we store:</p>
      <ul>
        <li>
          your <strong>name</strong> and <strong>email address</strong>, whether the address is confirmed, the date
          the account was created, and its role (user, moderator, administrator);
        </li>
        <li>
          for sign-in with email and password, your <strong>password</strong>, only as a salted hash that cannot be
          turned back into the password;
        </li>
        <li>
          for sign-in with <strong>{providers}</strong>, the identifier of your account there
          and the tokens the provider issues for the sign-in (see section 6);
        </li>
        <li>
          for each signed-in session, its token and expiry, and the <strong>IP address</strong> and{" "}
          <strong>user agent</strong> it was started from, which let us recognize abuse of an account;
        </li>
        <li>if a moderator blocks the account, that fact and the reason given.</li>
      </ul>
      <p>
        We need these data to provide the account and the contributions it makes (Art. 6(1)(b) GDPR); the session
        details also serve our legitimate interest in the security of accounts (Art. 6(1)(f) GDPR). Accounts are for
        researchers, which is why sign-up by email asks for the address of a university or research institute.
        Your name is shown with what you publish; your email address is never shown on the site and is seen only by
        the moderators and administrators. From the domains of the addresses of everyone who contributed, the
        progress page shows totals only: how many contributors and institutions there are, and how many come from
        each country, never who is from where.
      </p>
      <p>
        <strong>Protection against bots.</strong> When you sign in, create an account or ask for a new password with
        your email address, Vercel&apos;s bot protection (Vercel BotID, which Vercel runs with its partner Kasada)
        checks that a person, not an automated program, sent the form. For that request only, a script loaded
        through our own address runs in your browser and sends Vercel technical characteristics of the browser and
        device; there is no puzzle to solve. Requests it judges automated are refused. The legal basis is our
        legitimate interest in protecting accounts against automated attacks such as password guessing and mass
        sign-ups (Art. 6(1)(f) GDPR); reading these characteristics from your device is strictly necessary for the
        sign-in you asked for (§ 25(2) no. 2 TDDDG). Vercel processes the data on our behalf (section 2).
      </p>

      <SectionTitle>5. Emails</SectionTitle>
      <p>
        We send you an email to confirm your address when you sign up or sign in unconfirmed, and when you ask to
        reset your password. The link in it is valid for one hour. We send no newsletters or other mail. The
        emails are delivered through the mail service of Google Ireland Limited, Gordon House, Barrow Street,
        Dublin 4, Ireland, which processes your address and the message to deliver it, and may do so in the USA,
        on the basis of the EU–US Data Privacy Framework (Art. 45 GDPR). The legal basis is the performance of your
        account (Art. 6(1)(b) GDPR).
      </p>

      <SectionTitle>6. Sign-in with {providers}</SectionTitle>
      {github ? (
        <p>
          If you choose to sign in with GitHub (GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA)
          or ORCID (ORCID, Inc., 10411 Motor City Drive, Suite 750, Bethesda, MD 20817, USA), you are sent to that
          provider and sign in there. It then tells us the identifier of your account, your name and, for GitHub,
          your email address and profile picture address; for ORCID, the email address on your public ORCID record
          if there is one. The provider learns that you sign in to {SITE.name}; its own privacy policy applies to
          what happens there. The legal basis is the performance of the account you asked for (Art. 6(1)(b) GDPR).
          Both providers may process data in the USA; GitHub is certified under the EU–US Data Privacy Framework
          (Art. 45 GDPR). You can always use email and password instead.
        </p>
      ) : (
        <p>
          If you choose to sign in with ORCID (ORCID, Inc., 10411 Motor City Drive, Suite 750, Bethesda, MD 20817,
          USA), you are sent to ORCID and sign in there. It then tells us your ORCID iD, your name and the email
          address on your public ORCID record, if there is one. ORCID learns that you sign in to {SITE.name}; its own
          privacy policy applies to what happens there. The legal basis is the performance of the account you asked
          for (Art. 6(1)(b) GDPR). ORCID may process data in the USA. You can always use email and password instead.
        </p>
      )}

      <SectionTitle>7. Your contributions</SectionTitle>
      <p>
        {SITE.name} is a public, citable database, and what you submit is meant to be published. We store your
        comments, results, suggested edits, proposed problems and blog posts with your account, and when you send
        them. Each is reviewed by a moderator first; we keep the decision, who made it and the note to you, in a log
        of moderation. Once accepted, a submission appears on the site with your name, or with the names you gave
        in its credit, and the date, and gets a permanent link so it can be cited. Your votes on results are stored
        with your account; the site shows only their totals. We also note when you last looked at your
        submissions, to show you what is new.
      </p>
      <p>
        The legal basis is the performance of the service you use when you submit (Art. 6(1)(b) GDPR), and our
        legitimate interest in a reliable, traceable scientific record (Art. 6(1)(f) GDPR). Do not put personal data
        of others into a submission beyond naming the people you credit or cite, and credit others only with their
        agreement.
      </p>

      <SectionTitle>8. Where the data are stored, and for how long</SectionTitle>
      <p>
        The database is run for us by Neon, Inc., USA, under a data processing agreement (Art. 28 GDPR), on servers
        in Frankfurt am Main, Germany. We keep your account data for as long as the account exists. Sessions are
        deleted when they expire or you sign out; links in emails expire after one hour.
      </p>
      <p>
        If you ask us to delete your account, we delete its data, including your email address, sessions and votes,
        together with your comments and the results you submitted. Accepted edits of problems, proposed problems
        and blog posts stay part of the record, because others cite and build on them, but are no longer tied to an
        account, and keep the credit they were published with; if you want your name taken off them as well, tell
        us, and we will weigh your request against the interest in a complete record (Art. 17(3) GDPR).
      </p>

      <SectionTitle>9. Your rights</SectionTitle>
      <p>Under the GDPR, you have the right</p>
      <ul>
        <li>to know which of your data we process and to get a copy of them (Art. 15);</li>
        <li>to have incorrect data corrected (Art. 16);</li>
        <li>to have your data deleted (Art. 17) or their processing restricted (Art. 18);</li>
        <li>to receive the data you gave us in a common, machine-readable format (Art. 20);</li>
        <li>
          to <strong>object</strong> at any time, on grounds relating to your particular situation, to processing
          based on our legitimate interests (Art. 21);
        </li>
        <li>
          to lodge a complaint with a data protection supervisory authority, in particular in the member state of
          your habitual residence, place of work or the place of the alleged infringement (Art. 77).
        </li>
      </ul>
      <p>To exercise them, write to {mail}.</p>

      <SectionTitle>10. Other points</SectionTitle>
      <p>
        You are not obliged to give us any data; without the details in section 4, however, you cannot create an
        account. We make no decisions based solely on automated processing (Art. 22 GDPR), and do not sell or
        share your data with anyone beyond the providers named here. We will update this policy when the site
        changes how it handles personal data.
      </p>
      <p className="text-ink-subtle">Last updated: {formatDate(LEGAL.privacyUpdated)}.</p>
    </div>
  );
}
