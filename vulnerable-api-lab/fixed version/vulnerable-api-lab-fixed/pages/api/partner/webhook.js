// pages/api/partner/webhook.js — FIXED (closes VAPT-2026-010: unsafe consumption of APIs)
//
// - The X-Partner-Signature header is now actually verified (HMAC-SHA256
//   over the raw request body, timing-safe compare) before anything in
//   the payload is trusted.
// - refundAmount is schema-validated: must be a finite number within a
//   sane, non-negative range. Negative "refunds" are rejected outright.
// - bodyParser is disabled so we can verify the signature over the exact
//   raw bytes the partner would have signed, not a re-serialized object.
import { users } from "../../../lib/db";
import { verifyWebhookSignature } from "../../../lib/auth";

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const MAX_REFUND = 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-partner-signature"];

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid or missing webhook signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Malformed JSON body" });
  }

  const { userId, refundAmount } = payload;
  const user = users.find((u) => u.id === Number(userId));
  if (!user) return res.status(404).json({ error: "No such user" });

  const amount = Number(refundAmount);
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_REFUND) {
    return res.status(400).json({ error: `refundAmount must be a number between 0 and ${MAX_REFUND}` });
  }

  user.balance = +(user.balance + amount).toFixed(2);
  res.status(200).json({ updatedBalance: user.balance });
}
