# 🛒 MockVulnerable E-Shop: Penetration Testing Sandbox Lab

An intentionally vulnerable, lightweight e-commerce application built using **Python and Flask** with a local **SQLite** database. This project is a hands-on learning playground for students to explore classic web application security vulnerabilities (OWASP Top 10) and learn how to implement secure coding patches.

---

## 🏗️ Project Architecture & Components

The workspace package contains three standalone scripts designed to work together:

1. **`app.py`**: The main web application engine. It runs the backend e-commerce portal, including user registrations, a shared login portal, a custom customer overview page, an administrator database logging sheet, and receipt endpoints.
2. **`exploit.py`**: An offensive automation toolkit built with the `requests` library. It acts as an adversarial proof-of-concept (PoC), simulating high-speed exploitation attacks (SQL Injection bypass and automated IDOR enumeration data scraping) against the web infrastructure.
3. **`view_db.py`**: A lightweight database inspector utility. Since Windows does not feature the `sqlite3` command-line utility by default, this script leverages Python's built-in engine to print table schemas and records directly to your workspace terminal interface.

---

## 🎯 Vulnerabilities Demonstrated

| Vulnerability Profile | Vulnerability Type | Description / Impact |
| :--- | :--- | :--- |
| **SQL Injection (SQLi)** | Injection (OWASP A03:2021) | Direct concatenation of string arguments into raw SQL statements allows an anonymous visitor to bypass login forms and administrative scopes. |
| **IDOR** | Broken Object Level Authorization (OWASP A01:2021) | Endpoint processing routes accept user-controlled IDs (`order_id`) without performing an accounting relationship check, allowing cross-tenant data harvesting. |
| **Reflected XSS** | Injection (OWASP A03:2021) | The system grabs URL parameters directly from the browser context (`?name=...`) and marks them as explicit trust markers (`| safe`), letting scripts fire within a session context. |
| **Broken Access Control** | Security Misconfiguration (OWASP A05:2021) | Logic controls verify administrative capabilities using loose, independent string checking rules rather than server-authoritative role flags. |
| **Cryptographic Failures** | Cryptographic Failures (OWASP A02:2021) | User data files store login verification secrets as unhashed plaintext strings inside the backend storage tables. |

---

## 🚀 Environment Setup & Lab Deployment

Follow these sequence blocks to launch the laboratory inside your **Visual Studio Code (VS Code)** environment:

### Step 1: Library Dependencies
Ensure Python is fully operational on your computer, open a terminal instance inside VS Code, and pull down the framework dependencies:
```bash
pip install Flask requests
```

### Step 2: Clear Outdated Artifacts
If you are modifying database structures or resetting user accounts, delete old variations of the database file:
```powershell
Remove-Item -Path .\ecommerce.db -ErrorAction SilentlyContinue
```

### Step 3: Run the Web Server Engine
In your primary terminal layout window (`Terminal #1`), run the Flask ecosystem wrapper script:
```powershell
python app.py
```
* **Expected Output Line:** `[!] Starting intentionally vulnerable learning lab environment on port 5000...`
* **Accessing the Site:** Open any web browser layout page and manually navigate tracking links directly to **`http://127.0.0.1:5000`**.

### Step 4: Inspect Live Database State Rows
Open a separate execution prompt panel in VS Code (`Terminal #2`) and launch the internal inspection module:
```powershell
python view_db.py
```
This prints out tables for `USERS` and `ORDERS` directly onto your development logs screen.

---

## 🧪 Guided Lab Exercises

### Exercise 1: SQL Injection (SQLi) Login Bypass
1. Navigate tracking paths directly to **`http://127.0.0.1:5000/login`**.
2. Type the bypass payload in the Username prompt field: `admin' --`
3. Enter any random dummy string value into the Password field (e.g., `test123`).
4. **The Security Failure:** The query ignores password parameters entirely, logging the session directly into the administrative control core view.

### Exercise 2: Insecure Direct Object References (IDOR) Scans
1. Authenticate with standard client credentials: User: `bob` / Password: `letmein123`.
2. Access your basic account order details, which routes paths directly through: `http://127.0.0.1:5000/receipt?order_id=2`.
3. Manually replace parameter characters at the tip of your address tracking bar to point at `order_id=1` (Alice's item) or `order_id=3` (Admin's item).
4. **The Security Failure:** The system drops sensitive database record layouts belonging to completely separate user sessions onto Bob's browser page.

### Exercise 3: Scripted Attack Automation Testing
Keep your main server interface active on `Terminal #1`. Switch control panels over to `Terminal #2` and fire off the automated penetration testing script:
```powershell
python exploit.py
```
The script automatically tests both vulnerabilities, bypasses authentication boundaries, and exfiltrates target data blocks sequentially to your screen in real time.

---

## 🛡️ Hardening Guide (Remediation Patches)

To clean up the security defects and fix your application against the `exploit.py` scripts, make the following replacements inside your `app.py` source file:

### Defensive Patch 1: SQLi Resolution via Prepared Statements
Locate your current database parsing lines inside the `@app.route('/login')` configuration block and replace string formatting layouts with strict **parameter bindings**:

```python
# 🔍 Replace the raw execute string query block with this:
query = "SELECT * FROM users WHERE username = ? AND password = ?"
with get_db() as conn:
    user = conn.execute(query, (username, password)).fetchone()
```

### Defensive Patch 2: IDOR Resolution via Multi-Tenant Token Alignment
Update the query statement execution properties inside the `@app.route('/receipt')` routing function to include user correlation enforcement:

```python
# 🔍 Replace the receipt endpoint verification lookup logic with this:
current_user_token = session['user_id']
with get_db() as conn:
    order = conn.execute(
        "SELECT * FROM orders WHERE id = ? AND user_id = ?", 
        (oid, current_user_token)
    ).fetchone()

if not order:
    return "Access Denied: Insufficient data access privileges for this entity record.", 403
```

---
*Disclaimer: This infrastructure platform package is strictly developed for educational training laboratories, cybersecurity defensive exploration modules, and penetration testing simulation scenarios.*
