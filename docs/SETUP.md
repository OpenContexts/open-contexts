# Setup: database and sign-in providers

How to set up the three external services OpenContext depends on: the **Neon** Postgres database (required),
and **GitHub** and **ORCID** sign-in (both optional). Email (SMTP) is covered in the
[development notes](DEVELOPMENT.md#quick-start).

All settings live in environment variables. Locally they go in `.env.local`. Copy `.env.example` to start;
`.env.local` is ignored by git and must never be committed. In production, set the same variables in your
host's settings, for instance Vercel → Project → Settings → Environment Variables.

- [1. Better Auth basics](#1-better-auth-basics) (needed by both sign-in providers)
- [2. Neon database](#2-neon-database)
- [3. GitHub sign-in](#3-github-sign-in)
- [4. ORCID sign-in](#4-orcid-sign-in)
- [5. Going to production](#5-going-to-production)
- [6. Troubleshooting](#6-troubleshooting)

## 1. Better Auth basics

Two variables are needed in every environment:

| Variable | Value |
| -------- | ----- |
| `BETTER_AUTH_SECRET` | A random secret that signs the session cookies. Generate one with `openssl rand -base64 32`. Use a different secret in production, and keep it stable: changing it signs everyone out. |
| `BETTER_AUTH_URL` | The site's public address without a trailing slash: `http://localhost:3000` locally, `https://your-domain.org` in production. |

`BETTER_AUTH_URL` matters for the sign-in providers: GitHub and ORCID send people back to
`<BETTER_AUTH_URL>/api/auth/callback/<provider>`, and that address must match the one registered with the
provider exactly (scheme, host, port and path). It is also the address used in citations and downloads.

## 2. Neon database

Problems, accounts and submissions all live in a Postgres database on [Neon](https://neon.tech). The app
talks to it with Neon's serverless driver over HTTP (`lib/db/index.ts`), and the tables are created by the
migrations in `drizzle/`.

### 2.1 Create the project

1. Sign up at <https://console.neon.tech>. The free plan is enough to start.
2. Create a **project**:
   - **Name**: e.g. `opencontext`.
   - **Postgres version**: the default.
   - **Region**: close to where the site will be hosted, for instance *AWS Europe Central (Frankfurt)* for a
     host in Europe. The region can't be changed later.
3. Neon creates a default branch (`main` or `production`), a database (`neondb`) and a role (the owner).

### 2.2 Get the connection string

1. On the project dashboard, click **Connect**.
2. Choose the branch, the database (`neondb`) and the role.
3. Turn **Connection pooling** on. The host name then contains `-pooler`, e.g.
   `ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech`.
4. Copy the connection string into `.env.local`:

   ```bash
   DATABASE_URL="postgresql://neondb_owner:<password>@ep-cool-name-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```

   Keep `sslmode=require`. If the string also contains `&channel_binding=require`, you can keep it.

### 2.3 Create the tables

```bash
pnpm install
pnpm db:migrate
```

This applies every migration in `drizzle/` that the database hasn't had yet: the auth tables, the problems
and the community tables (comments, contributions, edits, proposals, the activity log). Run it again whenever
new migrations arrive, e.g. after pulling changes.

If a migration fails with a connection or prepared-statement error over the pooled connection, run it once
over the **direct** connection: in **Connect**, turn connection pooling off and copy that string. Then:

```bash
DATABASE_URL="<direct connection string>" pnpm db:migrate
```

The app itself can keep using the pooled string.

### 2.4 Check it and create the first admin

1. Start the site with `pnpm dev` and open <http://localhost:3000>. A new database has no problems yet, so
   the list is empty.
2. Sign up on `/sign-up`, then make yourself admin:

   ```bash
   pnpm db:make-admin you@uni-example.edu
   ```

   This also marks the account as confirmed. For an account created with GitHub or ORCID, use the email the
   account got: it is shown in the account menu, and in Neon's **Tables** view of the `user` table.
3. Create problems in the dashboard under `/admin/problems`, from scratch or by uploading `.md` files in the
   format of the dashboard's "Download .md".

To look at the data, use `pnpm db:studio` (Drizzle Studio) or **Tables** in the Neon console. If you change
data directly there, press **Refresh the site** on the dashboard's overview, so the cached pages pick it up.

### 2.5 Separate databases for development and production

Neon **branches** are copies of a database that cost almost nothing to create. Use the default branch for
production, and a branch for development, so testing never touches real accounts or submissions:

1. In the Neon console, open **Branches** → **Create branch**, name it `dev`, and create it from the
   production branch (it starts as a copy of the data at that moment).
2. In **Connect**, select the `dev` branch and copy its pooled connection string into your local
   `.env.local`. Production keeps the default branch's string.
3. Migrations are per branch: run `pnpm db:migrate` against each branch that needs a new migration.

To start the development data over, use **Reset from parent** on the branch.

### 2.6 Schema changes

1. Edit the schema in `lib/db/schema/*`.
2. Run `pnpm db:generate`. It writes a new SQL migration to `drizzle/`; read it before applying it.
3. Run `pnpm db:migrate`, first on the development branch, then on production.
4. Commit the files in `drizzle/` together with the schema change.

`pnpm db:push` writes the schema directly, without a migration. Use it only on a throwaway branch.

### 2.7 Good to know

- **Cold starts**: on the free plan, a database that has been idle for a few minutes is suspended and wakes
  up on the next query. The first page view after a pause can take a moment longer.
- **No interactive transactions**: the HTTP driver can't hold a transaction open. For writes that must
  succeed or fail together, use `db.batch([...])`, as the moderation actions do.
- **Password leaked?** Reset the role's password in the Neon console (**Roles**), then update
  `DATABASE_URL` everywhere.
- **Backups**: Neon can restore a branch to an earlier point in time, within the history window of your
  plan (**Backup & Restore**).

## 3. GitHub sign-in

With GitHub, anyone with a GitHub account can sign up with any email address, independent researchers
included. The button appears on `/sign-in` and `/sign-up` as soon as both variables below are set.

### 3.1 Create an OAuth app

A GitHub **OAuth app** accepts only one callback URL, so create **one app per environment**: one for
`localhost` and one for production.

1. Open <https://github.com/settings/developers> → **OAuth Apps** → **New OAuth App**. To have the app
   owned by a GitHub organization rather than your own account, use the organization's
   **Settings → Developer settings → OAuth Apps** instead.
2. Fill in:

   | Field | Development | Production |
   | ----- | ----------- | ---------- |
   | Application name | `OpenContext (dev)` | `OpenContext` |
   | Homepage URL | `http://localhost:3000` | `https://your-domain.org` |
   | Authorization callback URL | `http://localhost:3000/api/auth/callback/github` | `https://your-domain.org/api/auth/callback/github` |

   Leave **Enable Device Flow** off.
3. Click **Register application**. GitHub shows the **Client ID**.
4. Click **Generate a new client secret** and copy it straight away: GitHub shows it only once.

### 3.2 Configure the site

```bash
GITHUB_CLIENT_ID="Ov23li..."
GITHUB_CLIENT_SECRET="..."
```

Restart `pnpm dev`. Then, on `/sign-in`, **Continue with GitHub** should take you to GitHub and back.

### 3.3 How GitHub accounts behave

- The account takes the GitHub name and the public email on the GitHub profile. If the profile shows no
  email, it takes the account's primary email instead: Better Auth asks GitHub for it with the `user:email`
  permission.
- GitHub accounts skip the institutional-email check (`validateUserInfo` in `lib/auth/index.tsx`): the GitHub
  account identifies the person.
- If someone already has an email-and-password account with the same address, Better Auth adds GitHub to
  that account instead of creating a second one, provided both addresses are verified.

## 4. ORCID sign-in

[ORCID](https://orcid.org) gives every researcher a persistent identifier (an ORCID iD such as
`0000-0002-1825-0097`), so it is the most natural sign-in for this site. It uses ORCID's free **Public
API**, through Better Auth's generic OAuth plugin (`lib/auth/orcid.ts`). The button appears as soon as both
credentials are set.

### 4.1 The email problem, and how it is solved

ORCID does not hand out email addresses during sign-in, but Better Auth needs one for every account. On the
first sign-in, the site therefore looks up the person's ORCID record:

- If the record has a **public, verified email** (visibility *Everyone* on the ORCID record), the account
  takes it, preferring the primary address.
- Otherwise the account gets a placeholder, `<orcid-id>@orcid.invalid`. The site never sends anything to
  it: no confirmation or password-reset emails. Wherever an address would be shown, the account menu shows
  the ORCID iD instead, and the About page shows "–".

So ORCID users without a public email can sign in and contribute, but cannot be emailed. Anyone who wants
that can make their email public on their ORCID record before signing up for the first time. The email is
only read when the account is created.

The account takes the name on the ORCID record. If the person has hidden their name, the ORCID iD is used
instead.

### 4.2 Register a public API client

Each ORCID account can register **one** public API client. Its credentials work on the environment where it
was registered: the production registry (`orcid.org`) or the sandbox (`sandbox.orcid.org`).

**Recommended:** use the **sandbox** for local development and a **production** client for the live site.

#### Production client (`orcid.org`)

1. Sign in at <https://orcid.org> with the ORCID account that should own the client, ideally the
   project's or a moderator's. Its primary email must be verified.
2. Open <https://orcid.org/developer-tools> (also in the user menu as **Developer tools**).
3. Accept the terms of the Public API and fill in the form:
   - **Name of your application**: `OpenContext`. Users see it on ORCID's consent screen.
   - **Application URL**: `https://your-domain.org`.
   - **Description**: e.g. "Sign in to OpenContext, a community database of open problems in generalized
     contextuality."
   - **Redirect URIs**: `https://your-domain.org/api/auth/callback/orcid`. You can add several, for
     instance a staging domain too.
4. Save. The page shows the **Client ID** (`APP-…`) and the **Client secret**.

#### Sandbox client (`sandbox.orcid.org`), for development

1. Create a separate account at <https://sandbox.orcid.org/register>. The sandbox only delivers email to
   addresses at `@mailinator.com`, so register with something like `opencontext-dev@mailinator.com`, and
   confirm it by opening that inbox at <https://www.mailinator.com>.
2. Open <https://sandbox.orcid.org/developer-tools> and register a client as above, with the redirect URI
   `http://localhost:3000/api/auth/callback/orcid`.
3. Test sign-ins with sandbox accounts (registered the same way), not with real ORCID iDs.

### 4.3 Configure the site

Development, with a sandbox client:

```bash
ORCID_CLIENT_ID="APP-XXXXXXXXXXXXXXXX"
ORCID_CLIENT_SECRET="..."
ORCID_SANDBOX="true"
```

Production, with a production client: the same two credentials, and `ORCID_SANDBOX` left empty or removed.

Restart `pnpm dev`. **Continue with ORCID** then appears on `/sign-in` and `/sign-up`.

### 4.4 How ORCID accounts behave

- Like GitHub accounts, ORCID accounts skip the institutional-email check.
- The ORCID iD is stored as the account's id (`account.account_id`, provider `orcid`), so signing in again
  with the same iD always reaches the same account, even if the person's ORCID email changes later.
- If the public ORCID email matches an existing, verified account, ORCID is added to that account. Otherwise
  a new account is created. With a placeholder email this always happens, so someone who first signed up
  with an institutional email and then uses ORCID without a public email gets a second, separate account.
- The site only asks ORCID for the `openid` scope. It reads the person's iD and name and their public email
  (from ORCID's public API), and never writes to the ORCID record.
- To make an ORCID account admin or moderator with `pnpm db:make-admin`, use its email: the public one, or
  `<orcid-id>@orcid.invalid`. Admins can also change roles in the dashboard under **Users**, which shows each
  account's sign-in methods.

## 5. Going to production

1. **Database**: use the production branch's pooled connection string as `DATABASE_URL`, and run
   `pnpm db:migrate` against it before the first deploy and after every new migration.
2. **Better Auth**: a new `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL="https://your-domain.org"`.
3. **GitHub**: the production OAuth app's credentials (callback on your domain).
4. **ORCID**: the production client's credentials, without `ORCID_SANDBOX`.
5. **Email**: real SMTP settings. Without `SMTP_HOST`, production refuses to send email (so email sign-ups
   fail with an error) rather than dropping confirmation links silently.
6. Sign up, make yourself admin with `pnpm db:make-admin` (with `DATABASE_URL` pointing at production), and
   check each sign-in method once.

If the domain changes later, update `BETTER_AUTH_URL` and the callback URLs at GitHub and ORCID together.

## 6. Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |
| `DATABASE_URL is not set` | `.env.local` is missing or has no `DATABASE_URL`. It must be in the project root. Restart `pnpm dev` after creating it. |
| The problem list is empty | Normal for a new database: create problems under `/admin/problems`. |
| `relation "…" does not exist` | The migrations haven't run on this database or branch: `pnpm db:migrate`. |
| The GitHub or ORCID button doesn't appear | One of the two credentials is missing or empty. Check the variable names, then restart `pnpm dev`. |
| GitHub: "The redirect_uri is not associated with this application" | The app's **Authorization callback URL** differs from `<BETTER_AUTH_URL>/api/auth/callback/github`. Check `localhost` against `127.0.0.1`, the port, `http` against `https`, and trailing slashes. |
| ORCID: "invalid redirect URI" or "redirect_uri_mismatch" | Register `<BETTER_AUTH_URL>/api/auth/callback/orcid` exactly under the client's redirect URIs. Check that `ORCID_SANDBOX` matches where the client was registered: sandbox credentials don't work on `orcid.org`, and the other way round. |
| ORCID: "invalid_client" or "Client not found" | Wrong client id or secret, or a sandbox client used without `ORCID_SANDBOX="true"`. |
| After a GitHub or ORCID sign-in: "An account with this email address already exists…" | An account with the same email exists but couldn't be linked automatically, usually because its email was never confirmed. Sign in the way that account was created, or confirm it (`pnpm db:make-admin <email> user` marks it confirmed). |
| "The sign-in could not be completed" | The provider sent back no usable profile or code, often after a cancelled or expired attempt. Try again. If it keeps happening, check the server log of `pnpm dev`. |
| Sign-in works locally but not in production | `BETTER_AUTH_URL` in production still says `localhost`, or the provider has only the development callback registered. |
