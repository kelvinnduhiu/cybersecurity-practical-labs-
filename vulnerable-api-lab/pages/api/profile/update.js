// API3:2023 Broken Object Property Level Authorization
// Bug on purpose: this "update my own profile" endpoint DOES check that
// you're only editing yourself (unlike API1's endpoint) — but it blindly
// spreads the entire request body onto the user object. There is no
// allowlist of editable fields, so a client can set role, isAdmin,
// isPremium, balance — fields that should never be client-writable.
import { readToken, findUserById } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "PUT") return res.status(405).json({ error: "PUT only" });
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing/invalid token" });

  const user = findUserById(auth.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // BUG: no allowlist. Try sending { "isAdmin": true, "role": "admin" }.
  Object.assign(user, req.body || {});

  const flag =
    user.isAdmin === true && user.role === "admin" && auth.userId !== 3
      ? " FLAG{mass-assignment-privilege-escalation}"
      : "";

  res.status(200).json({ updated: user, note: "No server-side allowlist on writable fields." + flag });
}
