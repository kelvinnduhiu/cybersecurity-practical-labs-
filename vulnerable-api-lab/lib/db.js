// lib/db.js
//
// In-memory "database" for the lab. State lives for the life of a warm
// serverless instance and resets on cold start / redeploy — that's fine
// for a training lab (don't use this pattern for anything real).
//
// NOTE: passwords are stored in PLAINTEXT on purpose. That is itself a
// finding worth pointing out to students (it ships inside several of the
// other vulnerabilities below, e.g. API9's legacy export).

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
    note: "Bob's private profile notes — none of your business. FLAG{BOLA-1-object-level-leak}",
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
    note: "Admin account. If you can read this via another user's session, that's API1/API3 territory.",
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
  WELCOME10: { percentOff: 10, maxRedemptions: 1000, redemptions: 0 },
  STUDENT50: { percentOff: 50, maxRedemptions: 5, redemptions: 0 } // intentionally scarce -> API6 abuse target
};

// --- Insecure "token" helpers (this IS the API2 vulnerability) ----------
// Tokens are just base64(JSON), completely unsigned. Anyone can forge one
// by hand. There is no verification anywhere in the app — that's the bug.
function issueToken(user) {
  const payload = { userId: user.id, username: user.username, role: user.role };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function readToken(req) {
  const header = req.headers["authorization"] || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return decoded; // trusted blindly by every endpoint below — no signature check
  } catch {
    return null;
  }
}

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
  issueToken,
  readToken,
  findUserById,
  findUserByUsername,
  nextOrderIdGetAndIncrement: () => nextOrderId++
};
