// API5:2023 Broken Function Level Authorization
// Bug on purpose: this admin-only function checks `req.headers['x-role']`
// — a header the CLIENT sets — instead of re-deriving the role from a
// trusted, server-verified source. Any user (even unauthenticated ones)
// can set `X-Role: admin` on the request and reach admin functionality.
import { users, readToken } from "../../../lib/db";

export default function handler(req, res) {
  const auth = readToken(req); // present only to look legit; never actually checked below
  const claimedRole = req.headers["x-role"]; // BUG: trusting a client header for authz

  if (claimedRole !== "admin") {
    return res.status(403).json({ error: "Admins only (send X-Role header ... wait.)" });
  }

  if (req.method === "GET") {
    const flag = " FLAG{broken-function-level-authz}";
    return res.status(200).json({ users, note: "Reached with a forged X-Role header, no real role check." + flag });
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    const idx = users.findIndex((u) => u.id === Number(id));
    if (idx === -1) return res.status(404).json({ error: "No such user" });
    const [removed] = users.splice(idx, 1);
    return res.status(200).json({ removed });
  }

  return res.status(405).json({ error: "GET or DELETE only" });
}
