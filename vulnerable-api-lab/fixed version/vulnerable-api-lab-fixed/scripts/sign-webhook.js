#!/usr/bin/env node
// scripts/sign-webhook.js
//
// Generates a valid X-Partner-Signature for a given JSON payload, using
// the same WEBHOOK_SECRET the server checks against. This simulates
// what the real partner's system would compute before sending a webhook
// — useful for retesting VAPT-2026-010 as a LEGITIMATE caller, since the
// whole point of the fix is that nobody else can produce a valid one.
//
// Usage:
//   WEBHOOK_SECRET=yoursecret node scripts/sign-webhook.js '{"userId":1,"refundAmount":15}'

const crypto = require("crypto");

const secret = process.env.WEBHOOK_SECRET || "dev-only-change-me-webhook-secret";
const body = process.argv[2];

if (!body) {
  console.error("Usage: node scripts/sign-webhook.js '<json body>'");
  process.exit(1);
}

const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

console.log("Body:      ", body);
console.log("Signature: ", signature);
console.log("\nExample curl:");
console.log(`curl -s -X POST $BASE/api/partner/webhook \\
  -H "Content-Type: application/json" \\
  -H "X-Partner-Signature: ${signature}" \\
  -d '${body}'`);
