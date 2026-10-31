// API10:2023 Unsafe Consumption of APIs
// Bug on purpose: this models a webhook from a "payment partner" telling
// us how to update an order (e.g. refundAmount, status). A real
// integration MUST verify the request really came from the partner
// (HMAC signature over the raw body, a shared secret, IP allowlist,
// timestamp/replay checks) and must validate the payload against a
// strict schema before trusting it. Here we do none of that: there IS an
// `X-Partner-Signature` header, but it is never checked, and the payload
// is trusted and applied as-is — including letting the "partner" set a
// NEGATIVE refund amount, which this buggy handler happily adds to the
// user's balance (an attacker who can reach this endpoint, e.g. because
// it's unauthenticated and its URL leaked, can mint themselves balance).
import { users, readToken } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // BUG: signature header exists for show, but is never verified.
  const _unverifiedSignature = req.headers["x-partner-signature"];

  const { userId, refundAmount, note } = req.body || {};
  const user = users.find((u) => u.id === Number(userId));
  if (!user) return res.status(404).json({ error: "No such user" });

  // BUG: no schema validation (refundAmount could be negative, a string,
  // astronomically large, etc.) and no bound on how much trust we place
  // in data that supposedly came from a third party.
  const amount = Number(refundAmount) || 0;
  user.balance = +(user.balance + amount).toFixed(2);
  user.note = note ?? user.note; // also blindly overwrites a stored field

  const flag = amount < 0 || amount > 100000 ? " FLAG{unsafe-consumption-of-third-party-api}" : "";

  res.status(200).json({
    updatedBalance: user.balance,
    note: "Webhook payload applied with no signature verification and no schema validation." + flag
  });
}
