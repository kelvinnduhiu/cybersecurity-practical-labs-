# Vulnerable API Lab — OWASP API Security Top 10 (2023)

A deliberately broken Next.js app for teaching API penetration testing. Each
`/api/*` route in `pages/api/` carries exactly one class of bug from the
[OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/),
with a comment at the top of the file explaining the bug and a `FLAG{...}`
returned on successful exploitation so students can self-verify.

> ⚠️ Every vulnerability here is intentional. Never copy this code into a
> real product.

## What's covered

| # | Category | File |
|---|---|---|
| API1 | Broken Object Level Authorization | `pages/api/users/[id].js` |
| API2 | Broken Authentication | `pages/api/auth/login.js`, `pages/api/auth/reset.js` |
| API3 | Broken Object Property Level Authorization | `pages/api/profile/update.js` |
| API4 | Unrestricted Resource Consumption | `pages/api/orders/bulk.js` |
| API5 | Broken Function Level Authorization | `pages/api/admin/users.js` |
| API6 | Unrestricted Access to Sensitive Business Flows | `pages/api/checkout/process.js` |
| API7 | Server Side Request Forgery | `pages/api/fetch-avatar.js` (target: `pages/api/internal/secret.js`) |
| API8 | Security Misconfiguration | `pages/api/debug/info.js` |
| API9 | Improper Inventory Management | `pages/api/v1/legacy/users-export.js` (not listed in `/api/docs`) |
| API10 | Unsafe Consumption of APIs | `pages/api/partner/webhook.js` |

The student-facing dashboard (`pages/index.js`) lists each challenge with a
nudge-level hint but no solution.

## Running locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. No `LAB_ACCESS_CODE` is needed locally — the
classroom gate (see below) only activates if that env var is set.

## Deploying to Vercel (`*.vercel.app`)

This is a zero-config Next.js app, so either path works:

**Option A — via the Vercel dashboard (no CLI needed)**
1. Push this folder to a new GitHub repo.
2. On [vercel.com](https://vercel.com) → **New Project** → import that repo.
3. Framework preset auto-detects as Next.js — leave build settings default.
4. Under **Environment Variables**, add `LAB_ACCESS_CODE` (see below), then **Deploy**.

**Option B — via the Vercel CLI**
```bash
npm i -g vercel
vercel login
cd vulnerable-api-lab
vercel        # preview deploy
vercel --prod # promote to your *.vercel.app production URL
```
You'll be prompted to link/create a project; accept the defaults.

### Classroom access gate

Because this will sit on a public `*.vercel.app` URL, `middleware.js` adds a
simple access-code wall around the whole app (students enter a code on
`/welcome` once per browser) so it isn't a random open target for bots and
scrapers. **This gate is unrelated to the lab's intentional vulnerabilities**
— once a student is in, every `/api/*` bug is fully live and the gate does
nothing to protect those routes.

Set it in Vercel under **Project Settings → Environment Variables**:

```
LAB_ACCESS_CODE = <something only your class knows>
```

Leave it unset to disable the gate entirely (e.g. for a fully open CTF).

### A note on SSRF scope

`GET /api/fetch-avatar` only ever issues a real outbound request back to
**this same app** (it maps whatever `target` a student sends onto a path on
the deployment's own origin). That's intentional: once this is live on the
public internet, an unrestricted SSRF proxy would let anyone use your
deployment to port-scan or hit arbitrary third-party hosts. The pedagogical
point — "the server trusts a client-supplied destination with no
allowlist" — is still fully intact via `pages/api/internal/secret.js`, which
plays the role of an internal-only service the SSRF bug can reach.

### State / reset

Data lives in an in-memory array (`lib/db.js`) and resets on cold start or
redeploy. For a multi-day class, expect state (created accounts, coupon
redemption counts, etc.) to occasionally reset — treat that as a feature,
not a bug: `vercel --prod` (or a dashboard "Redeploy") is your "reset the
lab" button between sections or cohorts.

## Suggested student tooling

- **Burp Suite / OWASP ZAP** — proxy + repeater for manual poking at each endpoint.
- **Postman or Insomnia** — collection-based testing, good for API4/API6 scripted abuse.
- **curl / httpx (Python)** — quick one-off requests, scripting brute force (API2) and batch abuse (API4/API6).
- **jwt_tool / CyberChef** — decoding and forging the lab's unsigned tokens (API2, and the privilege escalation chain in API1/API3/API5).
- **ffuf / dirsearch / Nuclei** — content discovery to find the undocumented v1 endpoint (API9).
- **mitmproxy** — inspecting what the SSRF-vulnerable endpoint actually requests (API7).

## Suggested session flow

1. Students log in as `alice`, inspect the token shape (API2 starts here).
2. BOLA on `/api/users/{id}` to read `bob`'s and `admin`'s records (API1).
3. Mass-assignment on `/api/profile/update` to self-promote to admin (API3).
4. Use that role (or a forged `X-Role` header, no promotion needed) to hit `/api/admin/users` (API5).
5. Abuse `/api/orders/bulk` and the `STUDENT50` coupon on `/api/checkout/process` (API4, API6).
6. Chain `/api/fetch-avatar` into `/api/internal/secret` (API7).
7. Poke `/api/debug/info?crash=1` (API8).
8. Content-discover the legacy export (API9).
9. Replay/tamper a fake partner webhook against `/api/partner/webhook` (API10).

Have students collect each `FLAG{...}` as a simple completion signal; pair it
with a short writeup of *why* the bug exists and *how* they'd fix it as the
actual deliverable.
