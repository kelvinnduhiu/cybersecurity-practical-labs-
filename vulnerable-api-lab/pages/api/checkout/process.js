// API6:2023 Unrestricted Access to Sensitive Business Flows
// Bug on purpose: STUDENT50 is meant to be a scarce, one-per-person
// coupon (maxRedemptions: 5 total, see lib/db.js), but nothing stops the
// SAME user (or a script) from redeeming it over and over — no per-user
// usage tracking, no CAPTCHA/human check, no velocity/rate limiting on a
// sensitive business flow (limited-discount checkout).
import { readToken, products, coupons } from "../../../lib/db";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const auth = readToken(req);
  if (!auth) return res.status(401).json({ error: "Missing/invalid token" });

  const { productId, couponCode } = req.body || {};
  const product = products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ error: "No such product" });

  let price = product.price;
  let couponApplied = null;

  if (couponCode) {
    const coupon = coupons[couponCode];
    if (!coupon) return res.status(400).json({ error: "Invalid coupon" });
    if (coupon.redemptions >= coupon.maxRedemptions) {
      return res.status(400).json({ error: "Coupon exhausted" });
    }
    // BUG: no check that THIS user hasn't already redeemed it.
    coupon.redemptions += 1;
    price = +(price * (1 - coupon.percentOff / 100)).toFixed(2);
    couponApplied = couponCode;
  }

  const flag =
    couponCode === "STUDENT50" && coupons.STUDENT50.redemptions > coupons.STUDENT50.maxRedemptions - 1
      ? " FLAG{business-flow-abuse-coupon-farming}"
      : "";

  res.status(200).json({
    product: product.name,
    originalPrice: product.price,
    finalPrice: price,
    couponApplied,
    couponRemaining: couponApplied ? coupons[couponCode].maxRedemptions - coupons[couponCode].redemptions : null,
    note: "Same coupon, same user, unlimited redemptions — no velocity control." + flag
  });
}
