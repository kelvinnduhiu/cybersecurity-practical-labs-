// API1:2023 Broken Object Level Authorization (BOLA)
// Bug on purpose: the handler checks that *a* token is present, but never
// checks that token.userId === the :id in the URL. Any logged-in user
// (alice) can GET/PUT bob's or admin's full record just by changing the
// number in the path.
import { readToken, findUserById } from "../../../lib/db";

export default function handler(req, res) {
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing/invalid token" });

  const user = findUserById(req.query.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (req.method === "GET") {
    // Returns the FULL object, including other users' password + notes.
    return res.status(200).json(user);
  }

  if (req.method === "PUT") {
    // No ownership check here either — see API3 for the mass-assignment
    // half of this same endpoint.
    Object.assign(user, req.body || {});
    return res.status(200).json(user);
  }

  return res.status(405).json({ error: "GET or PUT only" });
}
