// API2:2023 Broken Authentication
// Bugs on purpose:
//  1. No rate limiting / lockout -> crackable by brute force.
//  2. Verbose error messages reveal whether the USERNAME exists at all
//     (user enumeration) before password is even checked.
//  3. Tokens issued by lib/db.issueToken are unsigned base64(JSON) -> a
//     student can forge any identity/role without ever logging in.
import { findUserByUsername, issueToken } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { username, password } = req.body || {};

  const user = findUserByUsername(username);
  if (!user) {
    // Enumeration bug: distinct message for "no such user"
    return res.status(401).json({ error: "No such username" });
  }
  if (user.password !== password) {
    // Enumeration bug: distinct message for "wrong password"
    return res.status(401).json({ error: "Incorrect password" });
  }

  const token = issueToken(user);
  res.status(200).json({ token, note: "This token is unsigned base64(JSON). Try decoding and editing it." });
}
