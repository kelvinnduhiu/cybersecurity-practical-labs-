// API4:2023 Unrestricted Resource Consumption
// Bugs on purpose:
//  - `quantity` and `count` client-supplied values are used directly with
//    NO upper bound, so a single request can force the server to do an
//    unbounded amount of work (generating thousands of "orders" and
//    running an O(n^2) report calculation over them).
//  - No request size limit, no rate limiting, no pagination cap on GET.
import { orders, products, nextOrderIdGetAndIncrement, readToken } from "../../../lib/db";

export default function handler(req, res) {
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing/invalid token" });

  if (req.method === "POST") {
    const { productId, count } = req.body || {};
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return res.status(404).json({ error: "No such product" });

    const n = Number(count) || 1; // BUG: no max cap, no sanity check
    if (n > 200000) {
      // safety valve only to protect the actual host process from OOM —
      // the vulnerability (no reasonable business-logic cap, e.g. 10) is
      // still fully demonstrable well below this number.
      return res.status(400).json({ error: "Lab safety valve: try a smaller absurd number (it'll still prove the point)." });
    }

    const created = [];
    for (let i = 0; i < n; i++) {
      created.push({ id: nextOrderIdGetAndIncrement(), userId: auth.userId, productId: product.id, qty: 1 });
    }
    orders.push(...created);

    // Deliberately expensive "report" (O(n^2)) run synchronously on every
    // call — no async job queue, no cost limiting.
    let checksum = 0;
    for (let i = 0; i < created.length; i++) {
      for (let j = 0; j < Math.min(created.length, 50); j++) checksum += (i * j) % 97;
    }

    const flag = n >= 5000 ? " FLAG{unbounded-resource-consumption}" : "";
    return res.status(201).json({ createdCount: created.length, checksum, note: "No per-request or per-user cap existed." + flag });
  }

  if (req.method === "GET") {
    // BUG: 'limit' is attacker-controlled with no server-side ceiling.
    const limit = Number(req.query.limit) || orders.length;
    return res.status(200).json(orders.slice(0, limit));
  }

  return res.status(405).json({ error: "GET or POST only" });
}
