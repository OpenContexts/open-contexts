# Development

The technical side of OpenContext: the stack, the scripts, how the code is organized, and the decisions
behind it. To set up the database and the sign-in providers, see [SETUP.md](SETUP.md); for what is planned,
see [PLAN.md](PLAN.md).

## Stack

| Concern  | Choice |
| -------- | ------ |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack) |
| Styling  | Tailwind CSS v4; design tokens in `app/globals.css` |
| Database | Neon Postgres via `drizzle-orm/neon-http`, migrations with drizzle-kit |
| Auth     | Better Auth: email + password with verification and reset, optional GitHub and ORCID, roles via the admin plugin |
| Email    | react-email templates (`emails/`), sent with nodemailer over SMTP; printed to the terminal in development without SMTP |
| Content  | Markdown + YAML frontmatter, rendered with react-markdown + KaTeX |
| Validation | zod |

## Quick start

```bash
pnpm install
cp .env.example .env.local      # then fill in the values, see SETUP.md
pnpm db:migrate                 # create the tables (a new database has no problems yet)
pnpm dev
```

Then sign up on `/sign-up` and make yourself admin with `pnpm db:make-admin you@example.org`. This also marks
the account as verified. The dashboard is at `/admin`.

Email: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` for any SMTP account: your
institute's mail server, or Gmail with an [app password](https://myaccount.google.com/apppasswords)
(`smtp.gmail.com`, port 465). In development you can skip this: confirmation and password-reset links are
printed in the `pnpm dev` terminal.

## Roles and blocking

| Role | Can |
| ---- | --- |
| `user` | comment and submit contributions |
| `moderator` | also approve and reject submissions (`/admin`, except **Users**), and block regular users from a submission's review page |
| `admin` | also manage users: change roles, block (moderators too) and unblock accounts (`/admin/users`) |

Blocked accounts are signed out at once and cannot sign in again until an admin unblocks them. Admins cannot
be blocked, and nobody can block themselves. Their earlier
submissions stay as they are.

## Who can sign up

There are three ways to create an account:

- **GitHub**: any GitHub account, with any email address.
- **ORCID**: any ORCID iD. ORCID does not return email addresses, so the account takes the public, verified
  email on the ORCID record if there is one, and otherwise a placeholder `<orcid-id>@orcid.invalid` to which
  nothing is ever sent (`lib/auth/orcid.ts`; see [SETUP.md](SETUP.md#41-the-email-problem-and-how-it-is-solved)).
- **Email and password**: the address must belong to a university or research institute and must be
  confirmed. The check (`lib/auth/institutional.ts`) accepts:

  - the ~10,600 domains of the [Hipo university list](https://github.com/Hipo/university-domains-list),
    stored in `lib/auth/university-domains.json` (refresh with `pnpm update-university-domains`), including
    subdomains such as `physik.uni-ulm.de`;
  - academic suffixes such as `.edu`, `.ac.uk` and `.edu.au`;
  - a short list of research institutes (CERN, Max Planck, DESY, national labs, …);
  - anything in `EXTRA_EMAIL_DOMAINS` or `ALLOWED_EMAILS`.

Only account creation is checked; existing accounts are not re-checked when they sign in.

The site needs `DATABASE_URL`: problems, accounts and submissions all live in the database. Without it, the
problem list is empty and the database-backed sections show a setup hint.

## Scripts

| Script | What it does |
| ------ | ------------ |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `pnpm db:generate` | Write a SQL migration from changes in `lib/db/schema` |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push the schema directly (handy on a throwaway dev branch) |
| `pnpm db:studio` | Browse the database |
| `pnpm db:make-admin <email> [role]` | Set a user's role (`admin`, `moderator`, `user`) and mark the account verified |
| `pnpm update-university-domains` | Refresh the list of university email domains |
| `pnpm email:dev` | Preview the email templates in `emails/` at http://localhost:3001 |

## Project structure

```
app/
  (site)/                 public site: header + footer layout
    page.tsx              home
    problems/             list (search, status tabs, area filter) and /problems/[slug]
      [slug]/contribute/  one page per way to contribute: result, reference, edit
      [slug]/problem.md/  the problem with everything recorded about it, as Markdown (for AI agents)
      [slug]/problem.json/  the same, as JSON
    contribute/           how contributing works; /contribute/new-problem
    me/                   the signed-in user's submissions and their review status
    (auth)/               sign-in, sign-up, forgot-password, reset-password
    areas/ about/ guidelines/
    progress/             problems by status over time (a static SVG chart, cached daily)
    progress.json/        the progress figures as JSON
  admin/                  dashboard (its own minimal design): overview, problems (editor, .md download),
                          queues, review, activity, users
  api/auth/[...all]/      Better Auth endpoints
  fonts/                  Computer Modern (OFL)
  globals.css             Tailwind theme tokens and markdown prose styles
components/
  ui/                     basic reusable elements: Button, Input, Field, ChoiceCards, ActionCard, FramedBox, …
  admin/ui/               the admin dashboard's own small kit: buttons, inputs, cards, pills, page header
  layout/                 header, footer, navigation, account menu
  submissions/            the contribution forms
  problems/               problem box, list rows, status icon/badge, kind labels, DB-backed page sections
  progress/               the status chart
  markdown/               safe markdown + math renderer with citations, and an editor with live preview, \cite completion and a formatting summary
  admin/                  dashboard UI: navigation, problem editor, diff view, decision panel, row menus
lib/
  actions/                server actions for submissions (all create `pending` rows)
  auth/                   Better Auth config, client, session helpers, institutional-email check, ORCID
  areas.ts                the research goals that group the problems
  cite.ts                 BibTeX and plain-text citations
  email/send.ts           renders a template and sends it with nodemailer
  validation/             zod schemas for submissions and the problem editor
  data/                   database access: problems (cached), approved community content, moderation, users,
                          progress figures, the problem export
  db/                     Drizzle client and schema (auth, problems, community tables)
  constants.ts            shared vocabularies (statuses, contribution kinds, roles, …)
  site.ts                 site name, subtitle, contact, companion paper, navigation
emails/                   react-email templates (verification, password reset)
drizzle/                  generated SQL migrations (commit them)
scripts/                  one-off CLI scripts
docs/                     PLAN.md (plan and roadmap), SETUP.md (database and sign-in), this file
```
Put basic, domain-agnostic elements in `components/ui`. Feature-specific components go in
`components/<feature>`.

## Problems

Problems live in the `problem` table: number, URL name (slug), title, status, areas, tags, who posed it and
when, the boxed statement and the body as markdown, the history, the references and an optional note
(markdown, set by moderators only, shown in a blue box). Comments, results
and suggested edits point at a problem by its id, so renaming a problem's URL keeps them.

- **Moderators manage problems** under **Problems** in the dashboard: create (from scratch or from an
  uploaded `.md` file), edit (with a markdown preview), delete, and download any problem as a `.md` file
  with YAML frontmatter. A problem's number and URL are assigned when it is published and don't change.
  Every change is recorded in the activity log, and a status change or a "What changed" note also appears
  in the problem's public history.
- **Users suggest changes**: an approved edit is written into the problem (its version goes up), and an
  approved proposal becomes a new problem with the next free number.
- **Editing conflicts**: each problem has a `version`. Saving a form that was opened before someone else's
  change is refused instead of silently overwriting it, and edits suggested against an older version are
  flagged in the review.
- **Deleting** a problem also deletes its comments, results and suggested edits.
- **Initial content**: a new database starts empty. Create problems in the dashboard, or upload `.md` files
  in the format of "Download .md".

Each `##` heading in the body becomes a lettered section (A., B., …) on the problem page.

**Citations.** Each reference has a key (`erdos1959`, made from the first author and the year when it is
added, and kept when the citation is edited). The statement, body, note, history, results and comments cite
the problem's references with `\cite{key}` or `\cite{a, b}`; they render as `[1, 2]`, and each number shows
its reference in a card on hover or tap. In the editors, typing `\cite{` opens a list of the references
that filters as you type (`CitationsProvider` and `CiteAutocomplete` in `components/markdown`). Keys that
match no reference are refused when a form is submitted. References stored before keys existed get theirs on
reading (`withKeys` in `lib/references.ts`); the Markdown download writes citations as `[n]`.

## Notes

- **Why markdown and not MDX?** Problem texts are written and edited through the site, partly by users.
  MDX executes JavaScript, so it can't safely render that text. Markdown with KaTeX (`trust: false`) and no
  raw HTML can.
- **Rendering and caching**: every page is rendered in full on the server before it is sent, with no
  loading states (`export const instant = false` in `app/layout.tsx`). The data and the expensive parts are
  cached with `"use cache"`, so a page view costs no database query unless something changed. Only the
  session (account menu, comment box, moderator link) is read per visitor, and that costs a query only for
  signed-in visitors.
  - The problem list is cached under the `problems` tag. Every change to a problem (editor, approved edit,
    approved proposal, deletion) calls `updateTag("problems")`.
  - A problem page's content (`ProblemContent`, math included) is also cached under `community:<problem id>`.
    Moderation decisions invalidate it only when they change what the page shows: approving a comment or
    result, or reopening an approved one. Posting, and rejecting what was never shown, re-render nothing.
  - The counts in the problem lists ("3 contributions · 5 comments") are cached under `community-counts`;
    the same moderation decisions that change a problem page invalidate them.
  - `/problems` filters, searches and sorts on the server, from the cached list. Each combination of
    filters is rendered once and cached under `problems` too. The progress page is recomputed daily.
  - The cache lives in the server's memory (self-hosted), so a restart starts empty. On serverless hosting,
    entries are not shared between instances; see the `use cache: remote` directive if that matters.
  - If you change data directly in the database (e.g. `pnpm db:studio`), press **Refresh the site** on the
    dashboard's overview (admins only) so the pages pick it up.
  - `experimental.instantInsights` in `next.config.ts` limits the dev checks for instant navigations to
    segments that ask for them; otherwise `next dev` flags every page for not streaming.
- **KaTeX version**: `rehype-katex` renders math with its own `katex` dependency, while the stylesheet comes
  from ours. `pnpm-workspace.yaml` overrides both to one version; mismatched versions break the sizing of
  subscripts and superscripts.
- **Accepted edits and new problems** stay published if their author's account is deleted.
- **Downloads**: `lib/data/problem-export.ts` builds one document per problem (statement, text, references,
  history, approved contributions and comments, no email addresses), cached like the problem page. It is
  served as Markdown with YAML frontmatter (for AI agents and reading) and as JSON; the problem page links to
  both and lists them as `<link rel="alternate">`. `/progress.json` serves the progress page's figures.
- **Reference contributions** with a link are also cited on the problem: approving one appends its text and link to the
  problem's references (unless the same text or link is already there); reopening it removes the entry again.
- **Transactions**: the Neon HTTP driver has no interactive transactions. Use `db.batch([...])` for atomic
  multi-statement writes, as the moderation action does.
- **Schema changes**: edit `lib/db/schema/*`, run `pnpm db:generate`, review the SQL in `drizzle/`, then run
  `pnpm db:migrate`.
