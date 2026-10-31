// pages/api/checkout/process.js — FIXED (closes VAPT-2026-006: business flow abuse)
//
// Coupon redemption is now tracked PER USER, not just as a global
// counter — the same account can no longer redeem a scarce promo more
// than once, even though the shared pool still has capacity left.
import { readToken } from "../../../lib/auth";
import { products, coupons } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing or invalid token" });

  const { productId, couponCode } = req.body || {};
  const product = products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ error: "No such product" });

  let price = product.price;
  let couponApplied = null;

  if (couponCode) {
    const coupon = coupons[couponCode];
    if (!coupon) return res.status(400).json({ error: "Invalid coupon" });
    if (coupon.redeemedBy.has(auth.userId)) {
      return res.status(400).json({ error: "You have already redeemed this coupon" });
    }
    if (coupon.redemptions >= coupon.maxRedemptions) {
      return res.status(400).json({ error: "Coupon exhausted" });
    }
    coupon.redemptions += 1;
    coupon.redeemedBy.add(auth.userId);
    price = +(price * (1 - coupon.percentOff / 100)).toFixed(2);
    couponApplied = couponCode;
  }

  res.status(200).json({
    product: product.name,
    originalPrice: product.price,
    finalPrice: price,
    couponApplied,
    couponRemaining: couponApplied ? coupons[couponCode].maxRedemptions - coupons[couponCode].redemptions : null
  });
}
