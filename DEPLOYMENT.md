# AgroFlow — Deployment Guide

This walks through taking AgroFlow from your local checkout to a live
deployment: **Render** for hosting (API, web, USSD, SMS, WhatsApp,
database) and **Brevo** for transactional email. Mobile (Expo) is
covered separately at the end since app stores work differently from
web hosting.

Follow the sections in order — each one depends on the last.

---

## 1. What you need before starting

| Thing | Why | Get it at |
|---|---|---|
| Node.js 20 LTS | Runs everything locally | nodejs.org |
| pnpm | This is a pnpm workspace monorepo | `npm install -g pnpm` |
| Git | Version control, and how Render deploys | git-scm.com |
| GitHub account | Hosts your repo; Render deploys from it | github.com |
| VS Code | Editor (see §2 for setup) | code.visualstudio.com |
| Render account | Hosting for API, web, USSD, SMS, WhatsApp, Postgres | render.com |
| Brevo account | Transactional email (300/day free, no card needed) | brevo.com |
| A domain (optional) | Custom URL instead of `*.onrender.com` | any registrar |

You do **not** need paid accounts with AzamPay, Selcom, MalipoPay,
Africa's Talking, or Meta's WhatsApp Business API to deploy and run
AgroFlow — those integrations are intentionally stubbed (they log
instead of calling out) until you're ready to add real credentials.
See §7.

---

## 2. Set up VS Code

1. Install these extensions (Extensions panel, `Ctrl+Shift+X` /
   `Cmd+Shift+X`):
   - **Prisma** (`Prisma.prisma`) — syntax highlighting and
     autocomplete for `schema.prisma`.
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — for
     `apps/web`.
   - **ES7+ React/Redux/React-Native snippets** (optional, for the
     React/React Native files).
2. Open the repo root (not a subfolder) so the workspace sees every
   package: `File > Open Folder... > AgroFlow`.
3. If VS Code prompts to use the workspace TypeScript version, accept
   it — the repo pins a specific TypeScript version per package.
4. For `render.yaml` editing with autocomplete, associate it with
   Render's schema: open a `render.yaml`, click the language mode in
   the bottom-right status bar, and if prompted, or add to
   `.vscode/settings.json`:
   ```json
   {
     "yaml.schemas": {
       "https://render.com/schema/render.yaml.json": "render.yaml"
     }
   }
   ```
   (Requires the **YAML** extension by Red Hat.)

---

## 3. Get the code into one real repository

You've been receiving AgroFlow as per-phase zip files. Before
deploying, merge them into one working tree and push it to GitHub.

```bash
# Unzip every phase into the same folder, in order, letting later
# phases overwrite earlier placeholder files where they conflict.
mkdir agroflow && cd agroflow
for zip in ~/Downloads/AgroFlow-Phase*.zip; do
  unzip -o "$zip" -d .
done
```

Then remove the stale placeholder files flagged during the build (safe
to delete — real implementations superseded them):

```bash
rm -f AgroFlow/apps/web/src/app/providers/index.ts
rm -f AgroFlow/apps/web/src/app/router/index.ts
rm -f AgroFlow/apps/mobile/app/\(auth\)/index.ts
rm -f AgroFlow/apps/mobile/app/\(tabs\)/index.ts
rmdir AgroFlow/apps/mobile/app/profile 2>/dev/null
```

Initialize git and push:

```bash
cd AgroFlow
git init
git add .
git commit -m "Initial AgroFlow monorepo"
git branch -M main
git remote add origin https://github.com/<your-username>/agroflow.git
git push -u origin main
```

---

## 4. Verify it locally before deploying anything

Don't skip this — it's much faster to catch a problem on your laptop
than in a Render build log.

```bash
pnpm install
cp .env.example apps/api/.env
cp .env.example database/.env
cp .env.example channels/ussd/.env
```

Fill in `apps/api/.env` and `database/.env` with at least:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agroflow
JWT_SECRET=<any random 32+ character string>
JWT_REFRESH_SECRET=<a different random 32+ character string>
```

If you don't have Postgres running locally, the quickest path is
Docker:
```bash
docker run --name agroflow-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=agroflow -p 5432:5432 -d postgis/postgis:16-3.4
```
(That image ships PostGIS pre-installed, which plain `postgres:16`
doesn't.)

Then:
```bash
pnpm --filter @agroflow/database generate
pnpm --filter @agroflow/database migrate:dev
pnpm --filter @agroflow/database seed
pnpm --filter @agroflow/api dev      # http://localhost:4000
pnpm --filter @agroflow/web dev      # http://localhost:5173
```

Open `http://localhost:5173`, register an account, and walk through
creating a farm and a produce listing. If that works, you're ready to
deploy the same thing to Render.

---

## 5. Deploy to Render

AgroFlow is five backend-ish services (API, USSD, SMS, WhatsApp, and a
static web build) plus one Postgres database. The included
`render.yaml` at the repo root defines all of them as a **Blueprint**,
so you can create everything in one pass instead of six.

### 5.1 Create the Blueprint

1. Push `render.yaml` (already in the repo root) to GitHub if you
   haven't.
2. In the Render dashboard: **New > Blueprint**.
3. Connect your GitHub account if you haven't, then select the
   `agroflow` repo.
4. Render reads `render.yaml` and shows you the six resources it's
   about to create (`agroflow-db`, `agroflow-api`, `agroflow-web`,
   `agroflow-ussd`, `agroflow-sms`, `agroflow-whatsapp`).
5. Click **Apply**. Render provisions the database first, then builds
   each service.

### 5.2 Fill in the secrets Render asks for

Blueprint fields marked `sync: false` in `render.yaml` aren't
committed to git (correctly — they're secrets) — Render prompts you
for each one during Blueprint creation:

| Variable | Service | What to put |
|---|---|---|
| `CORS_ORIGIN` | api | Your web app's URL once known, e.g. `https://agroflow-web.onrender.com` (you can update this after first deploy) |
| `USSD_GATEWAY_API_KEY` | api, ussd, whatsapp | Any random 32+ char string — **must be the identical value** on all three services (it's the shared trusted-channel secret) |
| `PAYMENT_GATEWAY_API_KEY` | api | Any random 32+ char string (used once you wire in a real mobile money webhook) |
| `INTERNAL_SERVICE_SECRET` | api, sms | Any random 32+ char string — identical on both |
| `SMS_NOTIFY_URL` | api | `https://agroflow-sms.onrender.com/notify` (fill in after the sms service's URL is known) |
| `VITE_API_BASE_URL` | web | `https://agroflow-api.onrender.com/api/v1` (the api service's URL + `/api/v1`) |
| `AGROFLOW_API_URL` | ussd, whatsapp | `https://agroflow-api.onrender.com/api/v1` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | api | Your Brevo credentials — see §6 |
| `SMS_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` | sms, whatsapp | Leave blank for now — see §7 |

`JWT_SECRET` and `JWT_REFRESH_SECRET` are generated automatically by
Render (`generateValue: true` in the blueprint) — you don't need to
supply these.

**Chicken-and-egg note:** a few of these (like `CORS_ORIGIN` and
`VITE_API_BASE_URL`) reference another service's URL, which you only
know once that service exists. Render assigns predictable URLs
(`https://<service-name>.onrender.com`) based on the `name` field in
`render.yaml`, so you can fill these in immediately using the names
above — you don't need to wait for the first deploy to finish.

### 5.3 Enable PostGIS on the database

Render's managed Postgres supports the PostGIS extension, but it's not
enabled by default. After `agroflow-db` finishes provisioning:

1. In the Render dashboard, open `agroflow-db` → **Connect** → copy
   the **PSQL Command**.
2. Run it in your terminal (requires `psql` installed locally), then:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. This only needs to happen once, before the API's first migration
   runs (the schema uses a PostGIS `geography` column for farm
   locations).

### 5.4 Run the migration and seed against production

Render web services don't run one-off commands automatically. Use the
Render **Shell** tab on `agroflow-api` (or `render shell agroflow-api`
via the [Render CLI](https://render.com/docs/cli)) once the service
has deployed successfully at least once:

```bash
pnpm --filter @agroflow/database migrate:deploy
pnpm --filter @agroflow/database seed
```

### 5.5 Confirm each service is healthy

Every service exposes `GET /health`:

```bash
curl https://agroflow-api.onrender.com/health
curl https://agroflow-ussd.onrender.com/health
curl https://agroflow-sms.onrender.com/health
curl https://agroflow-whatsapp.onrender.com/health
```

Each should return `{"status":"ok"}`. Then open
`https://agroflow-web.onrender.com` in a browser and register an
account for real.

### 5.6 Custom domain (optional)

Render → your service → **Settings** → **Custom Domains** → add your
domain, then add the CNAME record it shows you at your registrar.
Render issues a free SSL certificate automatically once the DNS
propagates. Do this for `agroflow-web` at minimum (e.g.
`app.yourdomain.com`); the backend services are usually fine on their
`onrender.com` URLs since end users never see them directly.

---

## 6. Set up Brevo for email

AgroFlow's `apps/api/src/services/email` sends through SMTP using
whatever provider you configure — this section wires it to Brevo,
which has the most generous free tier for a project this size (300
emails/day, forever, no credit card).

1. Sign up at [brevo.com](https://www.brevo.com) — free tier, no card
   required.
2. **Verify a sender.** Brevo won't relay mail from an address it
   hasn't confirmed. Go to **Senders, Domains & Dedicated IPs →
   Senders → Add a Sender**, enter an email address you control (e.g.
   `no-reply@yourdomain.com`, or even a personal address to start),
   and click the confirmation link Brevo emails you.
   - For better deliverability later, you can instead verify your
     whole *domain* (adds DKIM/SPF DNS records) — worth doing once
     you have a real domain, not required to get started.
3. **Generate an SMTP key.** Go to **SMTP & API** (top-right profile
   menu) → **SMTP** tab → **Generate a new SMTP key**. Copy it
   immediately — Brevo only shows the full key once.
4. Set these on `agroflow-api` in Render (or your local `.env`):
   ```
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<your Brevo login email>
   SMTP_PASSWORD=<the SMTP key you just generated -- NOT your Brevo account password>
   SMTP_FROM=AgroFlow <no-reply@yourdomain.com>
   ```
   (Use the exact sender address you verified in step 2 for
   `SMTP_FROM`, or mail will be rejected.)
5. Redeploy `agroflow-api` (or restart it) to pick up the new env
   vars.

That's it — `sendEmail()` in `apps/api/src/services/email/index.ts`
will now actually send instead of logging. AgroFlow doesn't have an
email-triggered flow built yet (auth is phone/OTP-based, notifications
go through SMS/WhatsApp), so this is ready for whenever you add one —
e.g. a password-reset flow, or a daily digest for desk-role users.

---

## 7. Turning on the stubbed integrations (optional, do later)

Several pieces were deliberately built to **log instead of calling a
real paid API**, so you could deploy and use AgroFlow before signing
up for anything. Turn these on whenever you're ready:

- **Mobile money (AzamPay / Selcom / MalipoPay)** — add the real
  outbound API call in `apps/api/src/services/payments/index.ts`'s
  `initiatePayment()`, and point that provider's webhook at
  `POST /api/v1/payments/webhook` with the `PAYMENT_GATEWAY_API_KEY`
  header.
- **SMS (Africa's Talking or similar)** — fill in
  `channels/sms/src/gateway.ts`'s `sendSms()` with the provider's send
  call, and set `SMS_API_KEY`.
- **WhatsApp (Meta Cloud API)** — fill in
  `channels/whatsapp/src/gateway.ts`'s `sendWhatsAppMessage()`, and
  set `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`. You'll also
  register the webhook URL (`https://agroflow-whatsapp.onrender.com/webhook`)
  with Meta and set `WHATSAPP_VERIFY_TOKEN` to match what you enter in
  their dashboard.
- **USSD gateway** — register
  `https://agroflow-ussd.onrender.com/ussd/callback` as your callback
  URL with your chosen Tanzanian USSD aggregator, and set
  `USSD_GATEWAY_API_KEY` to whatever shared secret they support (or
  keep the generated one if they let you set it).

None of these block deployment — the app works end-to-end without
them, just without the outbound message/payment actually leaving your
server.

---

## 8. Mobile (Expo) — different flow, not part of Render

The mobile app doesn't deploy to Render — it builds to app-store
binaries via Expo's own service (EAS).

1. `npm install -g eas-cli`
2. `cd apps/mobile && eas login` (create a free Expo account if you
   don't have one)
3. Set `apps/mobile/app.json`'s `expo.extra.apiUrl` to your deployed
   API: `https://agroflow-api.onrender.com/api/v1`
4. `eas build:configure`
5. For internal testing (fastest path, no app-store review):
   ```bash
   eas build --profile preview --platform android
   ```
   This produces an installable `.apk` link you can share directly.
6. For real app-store distribution, you'll need Apple
   Developer ($99/year) and/or Google Play Developer ($25 one-time)
   accounts, then:
   ```bash
   eas build --profile production --platform all
   eas submit --platform all
   ```

---

## 9. After you're live — a short checklist

- [ ] Rotate any secret you typed into a terminal or chat during
      setup (generate fresh values in Render for anything that felt
      exposed).
- [ ] Set `CORS_ORIGIN` on `agroflow-api` to your real web domain, not
      `*`.
- [ ] Confirm `NODE_ENV=production` is set on `agroflow-api` — this
      disables the `/api/v1/test/*` RBAC-verification routes (see
      `apps/api/src/routes/index.ts`), which should never be reachable
      in production.
- [ ] Set up Render's auto-deploy (on by default for Blueprint
      services) so pushes to `main` deploy automatically — or turn it
      off per-service if you'd rather deploy manually.
- [ ] Bookmark the Render dashboard's **Logs** tab for each service —
      it's the fastest way to see what's actually happening when
      something doesn't work as expected.
