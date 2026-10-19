import os
import sqlite3
from flask import Flask, request, render_template_string, redirect, session, url_for, flash

app = Flask(__name__)
app.secret_key = "super_secret_vulnerable_key"
DATABASE = 'ecommerce.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# --- REMEDIAL DB INITIALIZATION ---
def init_db():
# ====================================================================
# ✅ UPDATED SEED LOGIC (Replace the database insertion section at the bottom)
# ====================================================================
 if __name__ == '__main__':
    if not os.path.exists('ecommerce.db'):
        with sqlite3.connect('ecommerce.db') as c:
            c.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, is_admin INT, address TEXT)")
            c.execute("CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INT, item TEXT, price REAL)")
            
            # Seed multiple users
            c.execute("INSERT INTO users VALUES (1, 'admin', 'AdminPass2026!', 1, 'HQ')")
            c.execute("INSERT INTO users VALUES (2, 'alice', 'password123', 0, 'Street A')")
            c.execute("INSERT INTO users VALUES (3, 'bob', 'letmein123', 0, 'Street B')") # Added Bob explicitly
            
            # Seed multiple mock orders across different accounts
            c.execute("INSERT INTO orders VALUES (1, 2, 'Cybersecurity Textbook', 89.99)") # Alice's Order
            c.execute("INSERT INTO orders VALUES (2, 3, 'Premium Hacker Hoodie', 45.00)")  # Bob's Order
            c.execute("INSERT INTO orders VALUES (3, 1, 'Admin Secure Router DevKit', 299.99)") # Admin's Order
            c.commit()

# --- REFACTORED SECURE BASE LAYOUT IMPLEMENTATION ---
def render_with_layout(child_content, **context):
    """
    Renders child views safely inside the global interface wrapper dynamically 
    per request context, avoiding initialization compilation bugs entirely.
    """
    base_html = f"""
    <!DOCTYPE html>
    <html>
    <head><title>MockVulnerable E-Shop</title></head>
    <body style="font-family: Arial; margin: 40px; background-color: #f4f4f9;">
        <div style="text-align:center; margin-bottom:20px; font-weight: bold;">
            <a href="/">Home</a> | <a href="/login">Login</a> | <a href="/register">Register</a> | <a href="/dashboard">Dashboard</a> | <a href="/admin" style="color:red;">Admin Panel</a>
        </div>
        <div style="max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px; background: #fff; border-radius: 8px;">
            {{% with messages = get_flashed_messages() %}}
                {{% if messages %}}
                    {{% for m in messages %}}<p style="color:red; font-weight:bold;">[!] {{{{m}}}}</p>{{% endfor %}}
                {{% endif %}}
            {{% endwith %}}
            {child_content}
        </div>
    </body>
    </html>
    """
    return render_template_string(base_html, **context)

# --- APPLICATION ROUTES ---

@app.route('/')
def home():
    content = """
    <h1>Welcome to MockVulnerable E-Shop!</h1>
    <p>Sandbox lab environment running securely on port 5000.</p>
    <p>Have your students try logging in as <code>admin</code> using SQL Injection payloads.</p>
    """
    return render_with_layout(content)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # Vulnerable SQLi Point: String concatenation allows ' OR '1'='1 bypasses
        query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
        try:
            with get_db() as conn:
                user = conn.execute(query).fetchone()
                if user:
                    session['user_id'] = user['id']
                    session['username'] = user['username']
                    session['is_admin'] = user['is_admin']
                    return redirect(url_for('dashboard'))
        except Exception as e:
            flash(f"DB Error Trace: {e}")
            
        flash("Invalid credentials.")
        
    content = """
    <h2>Customer & Staff Login</h2>
    <form method="POST">
        <label>Username:</label><br>
        <input type="text" name="username" style="width:100%; padding:8px;"><br><br>
        <label>Password:</label><br>
        <input type="password" name="password" style="width:100%; padding:8px;"><br><br>
        <button type="submit" style="padding:10px 20px; background:#007BFF; color:#fff; border:none; cursor:pointer;">Login</button>
    </form>
    """
    return render_with_layout(content)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        address = request.form['address']
        try:
            with get_db() as conn:
                conn.execute("INSERT INTO users (username, password, is_admin, address) VALUES (?, ?, 0, ?)", (username, password, address))
                conn.commit()
            flash("Registered successfully! Proceed to login.")
            return redirect(url_for('login'))
        except Exception as e:
            flash("Registration error: Username might be taken.")
            
    content = """
    <h2>Create an Account</h2>
    <form method="POST">
        <label>Username:</label><br>
        <input type="text" name="username" style="width:100%; padding:8px;"><br><br>
        <label>Password:</label><br>
        <input type="password" name="password" style="width:100%; padding:8px;"><br><br>
        <label>Shipping Address:</label><br>
        <input type="text" name="address" style="width:100%; padding:8px;"><br><br>
        <button type="submit" style="padding:10px 20px; background:#28a745; color:#fff; border:none; cursor:pointer;">Register</button>
    </form>
    """
    return render_with_layout(content)

@app.route('/dashboard')
def dashboard():
    if 'username' not in session: 
        return redirect(url_for('login'))
        
    # Vulnerability Point: URL parameters bypass standard filtering rules (Reflected XSS)
    name_param = request.args.get('name', session['username'])
    
    content = f"""
    <h2>Customer Account Overview</h2>
    <p>Welcome back, <strong>{{{{ welcome_name | safe }}}}</strong>!</p>
    <p>Your secure interface token is active.</p>
    <div style="border:1px solid #ddd; padding:10px; margin-top:20px; background:#f9f9f9;">
        <h4>Lab Exercise Hint: IDOR Target Check</h4>
        <p>Try testing administrative harvesting paths by opening: <br>
        <a href="/receipt?order_id=1" target="_blank"><code>/receipt?order_id=1</code></a></p>
    </div>
    <br><a href="/logout">Logout</a>
    """
    return render_with_layout(content, welcome_name=name_param)

@app.route('/receipt')
def receipt():
    if 'username' not in session: 
        return "Authentication required.", 401
        
    # IDOR Vulnerability Point: No user identity structural lookup correlation
    oid = request.args.get('order_id')
    with get_db() as conn:
        order = conn.execute("SELECT * FROM orders WHERE id = ?", (oid,)).fetchone()
        
    if order: 
        return f"<h3>System Invoice Output Receipt</h3>Order Reference ID: {order['id']}<br>Product Item description: {order['item']}<br>Ex-Tax Cost: ${order['price']}"
    return "Data block metadata mismatch or unknown order identifier.", 404

@app.route('/admin')
def admin():
    # Broken Access Control Vulnerability Logic Flaw
    if session.get('username') == 'admin' or session.get('is_admin') == 1:
        with get_db() as conn: 
            users = conn.execute("SELECT * FROM users").fetchall()
            
        # Displaying cleartext user catalog values for demonstration
        user_list_items = "".join([f"<li>User: <b>{u['username']}</b> | Pass: <code>{u['password']}</code></li>" for u in users])
        content = f"""
        <h2 style="color:red;">Administrative Control Core</h2>
        <p>Complete global user schema index lookup database records:</p>
        <ul>{user_list_items}</ul>
        """
        return render_with_layout(content)
        
    return "Access Denied: Administrative security scope constraints prevent query execution.", 403

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

if __name__ == '__main__':
    init_db()
    print("[!] Starting intentionally vulnerable learning lab environment on port 5000...")
    app.run(debug=True, port=5000)