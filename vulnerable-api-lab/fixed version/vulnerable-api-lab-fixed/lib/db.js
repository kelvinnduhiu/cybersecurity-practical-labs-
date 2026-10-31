// lib/db.js — FIXED BRANCH
//
// Same in-memory "database" shape as the vulnerable branch, with two
// changes: (1) the insecure unsigned-token helpers have been removed —
// see lib/auth.js for the signed-token replacement (VAPT-2026-002); and
// (2) coupons.STUDENT50 now tracks *which users* have redeemed it, to
// close VAPT-2026-006.
//
// Passwords remain in plaintext here deliberately — that was not one of
// the ten reported findings, so it is out of scope for this patched
// branch. A production system should hash credentials regardless.

const users = [
  {
    id: 1,
    username: "alice",
    password: "alice123",
    email: "alice@example.com",
    role: "user",
    isAdmin: false,
    isPremium: false,
    balance: 50,
    note: "Just a regular customer.",
    resetToken: null
  },
  {
    id: 2,
    username: "bob",
    password: "bobrocks",
    email: "bob@example.com",
    role: "user",
    isAdmin: false,
    isPremium: false,
    balance: 120,
    note: "Bob's private profile notes.",
    resetToken: null
  },
  {
    id: 3,
    username: "admin",
    password: "SuperSecret!2024",
    email: "admin@lab.internal",
    role: "admin",
    isAdmin: true,
    isPremium: true,
    balance: 999999,
    note: "Admin account.",
    resetToken: null
  }
];

const products = [
  { id: 1, name: "Lab T-Shirt", price: 25, stock: 100 },
  { id: 2, name: "Lab Mug", price: 12, stock: 200 },
  { id: 3, name: "Rare Collector Badge", price: 500, stock: 3 }
];

const orders = [];
let nextOrderId = 1;

const coupons = {
  WELCOME10: { percentOff: 10, maxRedemptions: 1000, redemptions: 0, redeemedBy: new Set() },
  STUDENT50: { percentOff: 50, maxRedemptions: 5, redemptions: 0, redeemedBy: new Set() }
};

function findUserById(id) {
  return users.find((u) => u.id === Number(id));
}

function findUserByUsername(username) {
  return users.find((u) => u.username === username);
}

module.exports = {
  users,
  products,
  orders,
  coupons,
  findUserById,
  findUserByUsername,
  nextOrderIdGetAndIncrement: () => nextOrderId++
};
