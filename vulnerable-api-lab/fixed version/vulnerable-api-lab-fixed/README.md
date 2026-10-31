# Vulnerable API Lab — FIXED branch

This is the patched counterpart to `vulnerable-api-lab`. Every finding in the
penetration test report (VAPT-2026-001 through VAPT-2026-010) has exactly one
corresponding fix here. Use this branch to confirm that each remediation
actually closes the gap, not just that the demo exploit payload happens to
fail.

## Running locally

```bash
npm install
npm run dev
```

For a closer-to-production run, set real secrets first:

```bash
export TOKEN_SECRET=$(openssl rand -hex 32)
export WEBHOOK_SECRET=$(openssl rand -hex 32)
npm run dev
```

(If unset, obvious placeholder defaults are used — fine for quick local
testing, never acceptable for a real deployment.)

## Deploying to Vercel

Same as the vulnerable branch — zero-config Next.js. Set these environment
variables in **Project Settings → Environment Variables**:

| Variable | Purpose | Required? |
|---|---|---|
| `TOKEN_SECRET` | Signs session tokens | Strongly recommended |
| `WEBHOOK_SECRET` | Verifies partner webhook signatures | Strongly recommended |
| `LAB_ACCESS_CODE` | Classroom gate (same as vulnerable branch) | Optional |
| `LAB_EXPOSE_RESET_TOKENS` | Set to `true` only when retesting the reset flow yourself | Optional, off by default |

## Retest procedure, finding by finding

Run these against this branch; each should behave as described, in contrast
to the exploit steps that worked against the vulnerable branch.

**VAPT-2026-001 (BOLA)** — log in as `alice`, request `GET /api/users/2`
(bob). Expect `403 Forbidden`. Confirm `GET /api/users/1` (her own id) still
works and no longer includes her password field.

**VAPT-2026-002 (Broken Auth)** — decode a token; it's now
`base64url(payload).signature`, and editing the payload and re-encoding it
without recomputing a valid HMAC signature gets `401`. Submit 6 failed
logins for the same account; the 6th (and further, for 5 minutes) gets
`429`. Compute `base64(username:id)` for the reset flow; it no longer
matches anything the server issues.

**VAPT-2026-003 (Mass assignment)** — `PUT /api/profile/update` with
`{"isAdmin":true,"role":"admin"}`. Expect `200` but with `role`/`isAdmin`
unchanged on the account, and an `ignoredFields` array in the response
naming what was dropped.

**VAPT-2026-004 (Resource consumption)** — `POST /api/orders/bulk` with
`count: 6000`. Expect `400`. Confirm `count: 20` still succeeds.

**VAPT-2026-005 (Function-level authz)** — `GET /api/admin/users` with
header `X-Role: admin` but no real session. Expect `401`. Confirm a genuine
admin login (`admin` / `SuperSecret!2024`) can still reach it.

**VAPT-2026-006 (Business flow abuse)** — redeem `STUDENT50` as `alice`
twice in a row. Expect the 2nd call to return `400: "You have already
redeemed this coupon"`, even though the pool still has 4 redemptions left.

**VAPT-2026-007 (SSRF)** — `GET /api/fetch-avatar?target=/api/internal/secret`.
Expect `400`. Confirm `?target=/api/public/avatar-placeholder` still works.

**VAPT-2026-008 (Security misconfiguration)** — `GET /api/debug/info?crash=1`
with no admin session. Expect `401`/`403`, never a stack trace. With a real
admin session, confirm the crash path now returns a generic `500` message
with no trace, not the exception details.

**VAPT-2026-009 (Shadow API)** — `GET /api/v1/legacy/users-export`. Expect
Next.js's normal `404` — the route no longer exists in the deployed code at
all, not merely undocumented.

**VAPT-2026-010 (Unsafe webhook consumption)** — send the same forged
negative-refund payload from the report with no `X-Partner-Signature`.
Expect `401`. Then generate a legitimately signed request:

```bash
node scripts/sign-webhook.js '{"userId":1,"refundAmount":15}'
# paste the printed curl command, it will succeed with a 200
```

Try a validly signed but out-of-range amount (e.g. `refundAmount: -500` or
`50000`); expect `400` even with a correct signature.

## What's deliberately unchanged

- In-memory data store — state still resets on cold start/redeploy. This is
  a lab-infrastructure property, not a finding, and applies equally to both
  branches.
- Plaintext password storage — out of scope for the ten tracked findings,
  so left as-is here to keep the diff between branches focused and
  reviewable. Flag it as a bonus discussion point with students if useful.
- The classroom access gate (`middleware.js`) — unrelated to the OWASP
  findings in either branch.

## Suggested classroom use

Have students fork the vulnerable branch, write their own fix for one
assigned finding, and diff their patch against the corresponding file here
as a model answer — rather than simply handing this branch out up front.
