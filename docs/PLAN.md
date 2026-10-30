# OpenContext: project plan

## 1. Idea

OpenContext is a curated list of big open problems in theoretical physics, with a moderated community
layer on top:

- **Read**: every problem has a precise boxed statement, background, partial progress, significance,
  references, a dated status (open, under revision, solved) and a history.
- **Discuss**: signed-in users comment on problems.
- **Contribute**: users submit structured material (claimed solutions, partial or negative results,
  reformulations, computational evidence, independent verifications, expositions, challenges,
  questions, references). Each submission records its title, the type of material, how much AI was used,
  and the humans who take responsibility for it.
- **Improve**: users suggest edits to a problem's title, statement or text. Only moderators change the status (in the dashboard).
- **Moderate**: nothing user-submitted appears until a moderator approves it. Every decision is logged.

The look follows the prototype (<https://rafunds3d.github.io/OpenContext/>): a single reading column,
Computer Modern type, the paper's red framed problem boxes, apple icons that encode status, and lettered
sections.

## 2. Core concepts

| Concept | Where it lives | Notes |
| ------- | -------------- | ----- |
| Problem | `problem` table | Number, slug, statement and body (markdown), history, references, `version`. Managed in the dashboard. |
| Area | `lib/areas.ts` | The prototype's "goals". Groups problems; numbered I, II, … |
| Problem status | frontmatter / revision | `open` → `under-revision` (a solution has been claimed) → `solved`. |
| Comment | `comment` table | Markdown + math. Optional `parentId` for replies. |
| Contribution | `contribution` table | `kind`, `title`, `summary`, `url`, `aiUse`, `credit`. |
| Revision | `problem_revision` table | Full snapshot of title, statement and body, plus a change summary and the version it started from. Approval writes it into the problem. `problem_status` is only set on edits from before the status became moderator-only. |
| Proposal | `problem_proposal` table | A suggested new problem. Approval creates a `problem` row. |
| Moderation log | `moderation_log` table | Append-only: decisions on submissions and direct changes to problems (who, what, when, why). |
| Roles | `user.role` | `user`, `moderator` (reviews the queue, can block regular users), `admin` (also manages users: roles, blocking, unblocking). |

Every community table has the same moderation columns: `status` (`pending` | `approved` | `rejected`),
`reviewedById`, `reviewedAt` and `reviewNote`. Public reads (`lib/data/community.ts`) only ever return
`approved` rows.

## 3. Moderation workflow

```
user submits ──▶ pending ──(moderator approves)──▶ approved ──▶ visible on the site
                    │
                    └──(moderator rejects, with a note)──▶ rejected ──▶ the author sees the note
```

- One queue at `/admin` with a tab per submission type, oldest first. Comments and results
  can be approved or rejected straight from the list; edits and new problems are decided on the review page.
- Approve and reject run in one server action that updates the row and writes `moderation_log` in a single
  transaction (`db.batch`). It re-checks `requireModerator()` itself and never trusts the UI.
- Approving a revision invalidates the `problems` cache tag, so the new text appears immediately. Approving
  (or reopening an approved) comment or result invalidates only that problem page (`community:<id>`).
- Planned: bulk actions, per-user history, and email notifications to authors.

## 4. Routes

| Route | Prototype equivalent | State |
| ----- | -------------------- | ----- |
| `/` | home | done: masthead, counts, search, areas, recently updated |
| `/problems` | `#/problems` | done: search, status tabs, area filter, sort (all on the server) |
| `/problems/[slug]` | `#/problem/n` | done: statement, meta, lettered sections, tags; then references (10, expandable), history, contributions (5 newest, expandable, long texts clamped), the contribute options and the discussion (comment box first, 10 newest, expandable) |
| `/areas` | `#/agenda`, `#/tags` | done (basic) |
| `/guidelines`, `/about`, `/contribute` | same | placeholders |
| `/sign-in`, `/sign-up` | — | done: institutional email and password, or GitHub (any email) |
| `/admin` | `#/moderate` | done: overview, queues with quick decisions, review with diff, activity log |
| `/admin/problems` | — | done (moderators): list, create, edit, delete, download `.md` |
| `/admin/users` | — | done (admins only): search, pagination, roles, block and unblock |
| `/problems/[slug]/contribute/*` | `#/submit` | done: result, reference, edit; comments inline |
| `/contribute/new-problem` | `#/submit` | done |
| `/progress` | `#/progress` | done: step chart of problems by status since launch, and median days to a claim and to solved (no list of individual changes) |
| `/blog` | `#/blog` | later: informal posts, also moderated |
| `/me` | — | done |
| `/api/problems.json` | "Data as JSON" | later: public export of the approved data |

## 5. Roadmap

### Phase 0: setup (done)
- [x] Next.js 16 + Tailwind v4 design tokens from the prototype, Computer Modern fonts
- [x] `components/ui` primitives (Button, Input, Textarea, Select, Field, FramedBox, Callout, Tabs, Badge, Chip, headings, AppleIcon)
- [x] Problems as validated markdown, cached, with safe math rendering (moved into the database in Phase 3)
- [x] Neon + Drizzle: client, schema (auth and community tables), first migration, scripts
- [x] Better Auth: email and password, optional GitHub, roles via the admin plugin, session helpers
- [x] Public pages: home, list, detail, areas; moderation queue with approve/reject

### Phase 1: accounts and submissions (done)
- [x] Institutional-email sign-up (or GitHub with any email), email verification, password reset; emails with react-email + nodemailer (SMTP)
- [x] One focused form per contribution: comment (inline), result, reference, edit (prefilled), new problem
- [x] Live markdown and math preview in forms
- [x] `/me`: the user's own submissions with status and moderator notes
- [x] Limit of 20 pending submissions per user

### Phase 2: moderation (mostly done)
- [x] Approve or reject comments and results straight from the queue
- [x] Separate admin design: overview, queue per type (pending/approved/rejected), review page, activity log
- [x] Word-level diff for edits, preview of new problems in site typography
- [x] Approve, reject with a note to the author, reopen; every decision logged
- [ ] Email authors when their submission is decided
- [x] User management for admins: search, roles, block and unblock; moderators review and can block regular users
- [ ] Log role changes and blocks (who, when, why)
- [ ] Bulk actions; filter by problem and author

### Phase 3: problems in the database, published revisions and progress
- [x] Problems in the database; submissions reference them by id; 13 initial problems seeded by migration
- [x] Problem editor for moderators: create (also from an uploaded `.md`), edit with preview, delete, download as `.md`; logged
- [x] Approved edits replace the published text; approved proposals become numbered problems
- [x] Approved edits (and status changes) appear in "Progress and history"
- [ ] Approved results appear in the history too
- [ ] Credit lines like the prototype's ("advanced by", "verified by", "explained by"), derived from contributions
- [x] `/progress` chart of statuses over time (static SVG, `lib/data/progress.ts`)
- [ ] BibTeX "cite this entry"

### Phase 4: polish and launch
- [ ] Better search (Postgres full-text search once problems are in the DB, or a prebuilt index)
- [ ] OG images per problem, sitemap, RSS of approved activity
- [ ] JSON export, CC BY 4.0 license notice, about and guidelines content
- [ ] Deploy on Vercel with the Neon integration (a database branch per preview deployment)
- [ ] E2E tests (Playwright) for submit → moderate → visible

### Later
- A "download all" archive of the problems
- Blog posts, voting or "interest" markers, subscriptions to problems, ORCID sign-in.

## 6. Open questions

1. **Sign-in providers**: institutional email and password, or GitHub. ORCID would fit researchers well,
   but ORCID's OAuth does not return an email address, which Better Auth requires for every account. It
   would need a separate "confirm your email" step after the ORCID sign-in, so it is not added yet.
2. **Exceptions to the institutional rule**: independent researchers can sign up with GitHub. Is that
   enough, or should email sign-up also have a request form?
3. **Should comments also be pre-moderated?** They currently are (everything is). The alternative is
   post-moderation for trusted users to keep discussion flowing.
4. **Content ownership**: settled: the database is the source of truth; problems can be exported as `.md`.
