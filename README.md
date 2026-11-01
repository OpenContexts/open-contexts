# OpenContext

**Open problems in generalized contextuality.** A community-curated, moderated database of precisely stated
open problems in the subfield of quantum foundations that asks when experimental statistics resist a
classical explanation. Each problem has a live status, a record of partial progress, and the names of
everyone who posed, advanced, verified or explained it.

OpenContext is the case study of the companion paper *Accelerating research through human-AI collaboration:
A case study in quantum foundations* (Wagner et al., 2026).

## Why

Skilled researchers working with AI assistants can now settle well-posed problems remarkably fast. That makes
good questions more valuable than ever, and it creates new difficulties: several groups solving the same
problem with the same AI tools, a flood of quickly produced results that nobody has time to check, questions
asked without regard for whether they matter, and unclear credit for who posed, solved, checked and explained
what.

OpenContext tries out one concrete answer for one small field:

- **A shared list of problems**, each anchored to a long-term goal of the field's research agenda, so that
  effort goes where it advances the field.
- **One open record of progress**, so that it is visible what has been tried and achieved, and partial or
  negative results are not lost.
- **A place to digest results** before they are polished for the arXiv or a journal: claimed solutions are
  discussed, explained and independently verified here first.
- **Fine-grained credit**: posing a good question, verifying a solution or explaining it clearly is credited
  as much as producing it.

It adds an option rather than replacing existing ways of working; researchers who prefer to work on their
own remain free to do so.

## What you can do on the site

- **Read** the problems. Each has a precise statement in a red box, the background and motivation behind it,
  references, and a dated history.
- **Follow progress.** Every problem is *open*, *under revision* (a solution has been claimed and is being
  checked) or *solved*. The rules for each change are on the Guidelines page, and the Progress page shows how
  the list has moved over time.
- **Contribute** to a problem: a claimed solution, a partial or negative result, computational evidence, a
  reformulation, an independent verification, an explanation, a challenge, or a reference. Each contribution
  says how much AI was used and names the humans who take responsibility for it.
- **Discuss** a problem, suggest improvements to its statement, or propose a new problem.
- **Cite** any problem with a ready-made BibTeX entry.
- **Download** any problem, with everything recorded about it, as Markdown (for reading, or to give to an AI
  agent) or as JSON; the progress figures are available as JSON too.

Every submission is reviewed by a human moderator before it appears. The check is light: is it relevant, in
the required format, and backed by a named person? Moderators do not judge whether a claimed solution is
correct when they accept it; that is what the open discussion and independent verification are for.

## Who can take part

Anyone can read the site. To contribute, create an account under your own name, with one of:

- the email address of a university or research institute,
- an ORCID iD,
- a GitHub account.

The first cycle, **OpenContext I**, runs with a fixed list of problems for one year. New problems can be
proposed at any time and are kept for the next cycle. At the end of the year the project will be assessed
publicly, with its failures reported as carefully as its successes.

## Running the site

The site is a Next.js application with a Postgres database on Neon.

| Document | For |
| -------- | --- |
| [docs/SETUP.md](docs/SETUP.md) | Step by step: the Neon database, GitHub sign-in and ORCID sign-in, going to production, troubleshooting |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | The stack, scripts, project structure, roles, and technical notes |
| [docs/PLAN.md](docs/PLAN.md) | What exists, what is planned, and the open questions |

In short:

```bash
pnpm install
cp .env.example .env.local   # fill in the values, see docs/SETUP.md
pnpm db:migrate              # create the tables
pnpm dev                     # http://localhost:3000
```

## License and contact

Unless an entry says otherwise, the text of the database is released under CC BY 4.0. Questions and
suggestions: the moderators listed on the site's About page, or rafael.wagner@uni-ulm.de.
