# OpenContext: project plan

Last revised 1 November 2026, after comparing the site with the companion paper, *Accelerating research
through human-AI collaboration: A case study in quantum foundations* (Wagner et al., 2026). Section numbers
such as "Sec. II.C" or "Box II" refer to that paper.

## 1. Idea

OpenContext is a community-curated, moderated database of precisely stated open problems in generalized
contextuality. It is the case study of the companion paper: a test of whether a shared, structured list of
problems helps a research community coordinate human and AI-assisted work, record partial progress and
credit everyone fairly.

- **Read**: every problem has a precise boxed statement, a text in sections (background, relevance,
  significance, feasibility), references, a dated status (open, under revision, solved) and a history.
- **Discuss**: signed-in users comment on problems.
- **Contribute**: users submit structured material (claimed solutions, partial or negative results,
  reformulations, computational evidence, independent verifications, expositions, challenges, references).
  Each submission records its title, the type of material, how much AI was used, and the humans who take
  responsibility for it.
- **Improve**: users suggest edits to a problem's title, statement or text, and propose new problems.
- **Moderate**: nothing user-submitted appears until a moderator approves it. Every decision is logged.
- **Reuse**: every problem can be cited (BibTeX) and downloaded with everything recorded about it, as
  Markdown for AI agents or as JSON.

### Design principles (Sec. II)

1. **Community-driven selection.** The list reflects a collective judgment of significance, not that of one
   person or a small group.
2. **Live and open.** Statuses change as work proceeds and do not freeze at publication; entries can be
   cited by manuscripts.
3. **Traceable to goals.** Every problem traces to at least one long-term goal of the research agenda, so
   progress is judged by its relevance to the programme, not by difficulty or novelty.
4. **Fine-grained attribution.** Posing, curating, solving, verifying, refereeing and making results
   readable are recorded and credited separately.

The look follows the prototype (<https://rafunds3d.github.io/OpenContext/>): a single reading column,
Computer Modern type, the paper's red framed problem boxes, apple icons that encode status, and lettered
sections.

## 2. Core concepts

| Concept | Where it lives | Notes |
| ------- | -------------- | ----- |
| Problem | `problem` table | Number, slug, statement and body (markdown), history, references, an optional note (markdown, moderators only), `version`. Managed in the dashboard. |
| Area | `lib/areas.ts` | The long-term goals of the research agenda (Sec. III.B). Groups problems; numbered I, II, III. |
| Problem status | `problem.status`, set by moderators | `open` → `under-revision` (a solution has been claimed) → `solved`, and back (Fig. 2, Sec. II.C). |
| Comment | `comment` table | Markdown + math. |
| Contribution | `contribution` table | `kind`, `title`, `summary`, `url`, `aiUse`, `credit`. |
| Revision | `problem_revision` table | Full snapshot of title, statement and body, plus a change summary and the version it started from. Approval writes it into the problem. |
| Proposal | `problem_proposal` table | A suggested new problem. Approval currently creates a `problem` row (see Phase 4). |
| Activity log | `activity_log` table | Append-only: decisions on submissions and direct changes to problems (who, what, when, why). |
| Roles | `user.role` | `user`, `moderator` (reviews the queue, can block regular users), `admin` (also manages users: roles, blocking, unblocking). |
| Sign-in | Better Auth | Institutional email and password, GitHub, ORCID (`lib/auth/`). |
| Export | `lib/data/problem-export.ts` | One document per problem: statement, text, references, history, approved contributions and comments. |

Every community table has the same moderation columns: `status` (`pending` | `approved` | `rejected`),
`reviewedById`, `reviewedAt` and `reviewNote`. Public reads (`lib/data/community.ts`) only ever return
`approved` rows.

## 3. Workflows

### Moderation

```
user submits ──▶ pending ──(moderator approves)──▶ approved ──▶ visible on the site
                    │
                    └──(moderator rejects, with a note)──▶ rejected ──▶ the author sees the note
```

- One queue at `/admin` with a tab per submission type, oldest first. Comments and results can be approved
  or rejected straight from the list; edits and new problems are decided on the review page.
- Approve and reject run in one server action that updates the row and writes `activity_log` in a single
  transaction (`db.batch`). It re-checks `requireModerator()` itself and never trusts the UI.
- Approving a revision invalidates the `problems` cache tag, so the new text appears immediately. Approving
  (or reopening an approved) comment or result invalidates only that problem page (`community:<id>`).
- Moderation is deliberately light (Sec. II.C): moderators filter out only content that is unrelated,
  predatory or unethical, and do not judge correctness when accepting.

### Problem status (Fig. 2, Sec. II.C)

The rules are published on `/guidelines`. Today moderators apply them by hand in the problem editor; Phase 5
gives them support in the data and the interface.

```
open ──(solution claimed)──▶ under revision ──(published, or DOI + full understanding
  ▲                               │   ▲          + 3 independent verifiers + no dispute)──▶ solved
  │                               │   │                                                        │
  └──(claim withdrawn, or         │   └──────(substantiated challenge, seconded by an ─────────┘
      statement flawed)───────────┘           independent researcher)
```

- A proof of a weakened statement is a partial advance: the problem stays open, and the weaker statement can
  become a new problem.
- When a statement turns out to be flawed, the earlier version stays attached and the person who found the
  flaw is credited.

## 4. Routes

| Route | Prototype equivalent | State |
| ----- | -------------------- | ----- |
| `/` | home | done: masthead, companion paper, counts, search, goals, a random open problem, recently updated |
| `/problems` | `#/problems` | done: search, status tabs, area filter, sort (all on the server) |
| `/problems/[slug]` | `#/problem/n` | done: statement, meta, lettered sections, tags, note, citation and download buttons, references, history, contributions, contribute options, discussion |
| `/problems/[slug]/problem.md`, `.json` | "Data as JSON" | done: the problem with everything recorded about it, for AI agents and programs |
| `/problems/[slug]/contribute/*` | `#/submit` | done: result, reference, edit; comments inline |
| `/areas` | `#/agenda`, `#/tags` | done (basic) |
| `/guidelines` | same | done: participation, submission format, moderation, status rules, credit, cycles, assessment |
| `/about` | same | done: mission, companion paper, citation, moderators, data, license |
| `/contribute` | same | done: steps, curation criteria (Box I), problem structure, best practices (Box III) |
| `/contribute/new-problem` | `#/submit` | done |
| `/progress` | `#/progress` | done: step chart of problems by status, median days to a claim and to solved |
| `/progress.json` | — | done: the progress figures and each problem's status changes |
| `/sign-in`, `/sign-up` | — | done: institutional email and password, GitHub, ORCID |
| `/me` | — | done |
| `/admin` | `#/moderate` | done: overview, queues with quick decisions, review with diff, activity log |
| `/admin/problems` | — | done (moderators): list, create, edit, delete, download `.md` |
| `/admin/users` | — | done (admins only): search, pagination, roles, block and unblock |
| `/candidates` | — | Phase 4: proposed problems for the next cycle, with community reviews |
| `/blog` | `#/blog` | Phase 8: informal posts, also moderated |
| `/people/[id]` | — | Phase 6: a contributor's credited work |

## 5. Roadmap

### Done

- **Phase 0, setup**: Next.js 16 with Tailwind v4 and Computer Modern; UI primitives; safe markdown with math;
  Neon + Drizzle; Better Auth with roles; public pages and the moderation queue.
- **Phase 1, accounts and submissions**: institutional-email sign-up, GitHub sign-in, email verification and
  password reset; one focused form per kind of contribution, with live preview; `/me`; a limit of 20 pending
  submissions per user.
- **Phase 2, moderation**: quick decisions in the queue; separate admin design; word-level diffs; reject with
  a note, reopen; every decision logged; user management (roles, blocking).
- **Phase 3, problems in the database**: problem editor (create, upload `.md`, edit, delete, download);
  approved edits and proposals published; edits and status changes in the history; `/progress`; BibTeX
  citations.
- **Content aligned with the paper** (November 2026):
  - the Guidelines page with the governance of Sec. II.C;
  - the mission and companion paper on About;
  - the curation criteria and best practices on Contribute;
  - a Feasibility section and a solution criterion in the proposal template;
  - the companion paper's title fixed on the home page.
- **ORCID sign-in** through Better Auth's generic OAuth plugin. It uses the public, verified ORCID email if
  there is one, and otherwise a placeholder address that is never written to.
- **Downloads**: every problem as Markdown and JSON; `/progress.json`.
- **Docs**: [SETUP.md](SETUP.md) (Neon, GitHub, ORCID) and [DEVELOPMENT.md](DEVELOPMENT.md).

### Phase 4: the fixed list and new proposals (Sec. I.C, II.B)

Needed so that the site behaves as the Guidelines already describe.

- [ ] Approving a proposal no longer publishes it: it becomes a **candidate** for the next cycle. Moderators
      can still admit it to the active list explicitly.
- [ ] A public list of candidate problems (`/candidates`).
- [ ] **Community review of proposals** against the curation criteria (Box I). Any signed-in researcher can
      tick each criterion and comment, and reviews are a submission type of their own (Sec. II.C). Whether
      and how reviews add up to admission is an open question (see §6).
- [ ] **Cycles**: problems record the cycle they belong to ("OpenContext I"), with the cycle's start and end
      dates shown on the site.
- [ ] Proposals for **future goals** (objections to a goal, new directions), collected for the next cycle.
- [ ] Add a Feasibility section to the existing problems (content, done by the moderators in the editor).
- [ ] Link the companion paper once it has an address (`SITE.paper.url` in `lib/site.ts`).

### Phase 5: the status workflow (Fig. 2, Box II)

The rules exist on `/guidelines`; the data model and the interface should support them. This needs a
database migration.

- [ ] **Contributions refer to contributions**: a verification, challenge, exposition or revision points to
      the claimed solution it is about (`contribution.parentId`), and the problem page groups them under it.
- [ ] **Understanding declaration** on every result: "we claim full understanding" or "partial
      understanding" (solved condition (i); best practice "Be honest").
- [ ] **Provisional flag**: material can be submitted explicitly as provisional and flagged for revision
      (Box II).
- [ ] **Type of material**, separate from the kind of contribution: written argument, proof, code,
      numerics, preprint, … (Sec. II.C's fixed format).
- [ ] **Verifier declaration**: a verification states that the verifier is independent of the authors,
      declares no conflict of interest, understands the solution and agrees with it.
- [ ] **Panel for problems under revision**: the date of the claim, the number of independent
      verifications (out of the three needed) and of expositions. This is the paper's remedy for problems
      "parked" by unverified claims.
- [ ] **A checklist for marking a problem solved**, shown to moderators in the editor: peer-reviewed
      publication, or a DOI, full understanding, three independent verifications and no open dispute.
- [ ] **Seconding challenges**: a challenge to a solved problem can be seconded by an independent
      researcher; a seconded challenge prompts the moderators to reopen. **Disputes** get an open or
      resolved state.
- [ ] **Withdrawing a claim**: authors can withdraw their claimed solution, which keeps it attached as a
      provisional or negative result and returns the problem to open.
- [ ] **Public statement versions**: earlier versions of a statement stay readable (and citable), with a diff,
      and the person who found a flaw is credited in the history.
- [ ] Approving a claimed solution offers to move the problem to "under revision".
- [ ] Approved results appear in "Progress and history" too.
- [ ] Links between problems: "derived from" and "split into", for weakened statements and decompositions.

### Phase 6: credit and coordination (Sec. I.C, II.D)

- [ ] **Structured credit**: a list of people with affiliations (and ORCID iDs where known) instead of a
      free-text line, so that contributors and institutions can be counted.
- [ ] **Credit lines** on each problem, derived from its contributions: posed by, advanced by, verified by,
      explained by, flaw found by, curated by.
- [ ] **Contributor pages** (`/people/[id]`) listing everything a person is credited for.
- [ ] **"Working on this"**: an opt-in marker on a problem, with an optional note on the approach and a way
      to get in touch, so that overlapping efforts become visible and can be coordinated. It is never a
      claim to the problem.
- [ ] **Moderators add submissions for others**: material sent by email, or a preprint someone reported,
      recorded with its real authors and a "reported by" note.
- [ ] **Export of contributors** per problem, for inviting them to co-author the progress reports.

### Phase 7: measuring the case study (Sec. II.E)

- [ ] On `/progress` and in `/progress.json`, add:
  - the number of contributors and of institutions;
  - the share of problems with at least one submission;
  - how many problems were advanced or solved;
  - how much of each advance came from humans, AI or both (from the AI-use field);
  - the share of partial results discussed here before they appeared as preprints;
  - whether manuscripts that resolve listed problems cite the database.
- [ ] The success thresholds, once the moderation team has agreed on them (draft: 20 researchers from 10
      institutions; 50% of problems with a submission; 30% advanced and 10% solved).
- [ ] An optional, private question for contributors on their access to frontier AI models, to measure
      participation without such access.
- [ ] Data for the one-year assessment report: timestamps of every status change (already recorded),
      submissions over time, moderation load.

### Phase 8: blog and challenges to goals (Sec. II.C, IV.C)

- [ ] **Blog posts**: informal posts about a problem or the agenda, moderated like everything else (Sec.
      II.C names them as a submission type).
- [ ] **Challenges to a goal**: until they become an entry type of their own in the second cycle, they are
      collected as blog posts. Later, a challenge is attached to a goal, states the objection, the
      assumption it contests and what the goal would lose, and has no solution; it can spawn problems.

### Phase 9: polish and launch

- [ ] Email authors when their submission is decided (not for ORCID accounts without an email).
- [ ] Log role changes and blocks (who, when, why).
- [ ] Bulk actions in the queue; filter by problem and author.
- [ ] Better search (Postgres full-text search).
- [ ] OG images per problem, sitemap, RSS of approved activity.
- [ ] Deploy on Vercel with the Neon integration (a database branch per preview deployment).
- [ ] E2E tests (Playwright) for submit → moderate → visible, and for each sign-in method.
- [ ] Let ORCID users add a contact email after signing in (with confirmation), and let any user add ORCID
      or GitHub to an existing account from their account page.

### Later ideas

- **A machine-readable index** for AI agents: `/problems.json` (all problems), an `llms.txt` that explains
  the site and its downloads, and perhaps a "copy as prompt" button. The paper expects a database "that AI
  agents can query".
- **Subscriptions** to a problem: email or RSS when something is added.
- **A map of the field** (Sec. IV.C): definitions, examples, counterexamples, lemmas and theorems with their
  relations and provenance, with the open problems at its boundary.
- **Formalization**: an optional field for a formal statement (for instance in Lean) and links to
  machine-checked proofs. This strengthens verification but does not replace it.
- **Apprenticeship**: progressively harder tasks for students, from verifying known results to the open
  problems.
- **Preprint servers**: show the AI-use labels of Hexagon deposits, and watch the arXiv for preprints that
  cite listed problems.
- **Scaling** after the assessment: further subfields, within OpenContext or together with existing
  initiatives such as the QIQCOP zoo.
- A "download all" archive of the problems.

## 6. Open questions

1. **Admitting new problems**: how is community approval of a proposal reached: a number of positive
   reviews against Box I, an endorsement, or the moderators' decision after reviews? The paper warns against
   popularity bias (Sec. IV.B), so plain voting is not the default.
2. **Success thresholds**: the numbers for the one-year assessment (Sec. II.E) are drafts and must be fixed
   by the moderation team before launch.
3. **Should comments also be pre-moderated?** They currently are, like everything else (as Sec. II.C asks).
   The alternative is post-moderation for trusted users, to keep discussion flowing.
4. **Exceptions to the institutional rule**: independent researchers can sign up with GitHub or ORCID. Is
   that enough, or should email sign-up also have a request form?
5. **ORCID accounts without a public email** cannot be emailed. Should the site ask them for a contact
   address after the first sign-in?
6. **Participation without frontier AI**: how to measure it (Sec. II.E) without asking for more than people
   want to share.
7. **License of the code**: the content is CC BY 4.0; the code has no license yet.

Settled: the database is the source of truth, and problems can be exported as `.md`. ORCID sign-in works
without a separate email step (see [SETUP.md](SETUP.md#41-the-email-problem-and-how-it-is-solved)).
