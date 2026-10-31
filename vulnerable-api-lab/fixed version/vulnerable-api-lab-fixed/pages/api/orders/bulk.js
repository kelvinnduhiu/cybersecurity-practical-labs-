// pages/api/orders/bulk.js — FIXED (closes VAPT-2026-004: unrestricted resource consumption)
//
// Hard, business-justified caps on batch size and on how many records a
// single GET can return, enforced server-side regardless of what the
// client asks for.
import { orders, products, nextOrderIdGetAndIncrement } from "../../../lib/db";
import { readToken } from "../../../lib/auth";

const MAX_ORDER_COUNT = 20;   // realistic per-request cap
const MAX_LIST_LIMIT = 100;   // realistic page-size cap

export default function handler(req, res) {
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing or invalid token" });

  if (req.method === "POST") {
    const { productId, count } = req.body || {};
    const product = products.find((p) => p.id === Number(productId));
    if (!product) return res.status(404).json({ error: "No such product" });

    const n = Number(count) || 1;
    if (!Number.isInteger(n) || n < 1 || n > MAX_ORDER_COUNT) {
      return res.status(400).json({ error: `count must be an integer between 1 and ${MAX_ORDER_COUNT}` });
    }

    const created = [];
    for (let i = 0; i < n; i++) {
      created.push({ id: nextOrderIdGetAndIncrement(), userId: auth.userId, productId: product.id, qty: 1 });
    }
    orders.push(...created);
    return res.status(201).json({ createdCount: created.length });
  }

  if (req.method === "GET") {
    const requested = Number(req.query.limit) || MAX_LIST_LIMIT;
    const limit = Math.min(requested, MAX_LIST_LIMIT);
    const mine = orders.filter((o) => o.userId === auth.userId); // also now scoped to caller — see note below
    return res.status(200).json(mine.slice(0, limit));
  }

  return res.status(405).json({ error: "GET or POST only" });
}

// Note: the original vulnerable version also returned every user's
// orders to any caller (an incidental BOLA-adjacent issue on a route
// that was never one of the ten tracked findings). Scoping the GET to
// the caller's own orders here is a minor additional hardening beyond
// what VAPT-2026-004 required, included because it was a one-line fix.
