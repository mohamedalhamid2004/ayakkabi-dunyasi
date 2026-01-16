const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'database.sqlite');
const DATA_FILE = path.join(__dirname, 'data', 'products.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

// Init DB
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        isAdmin INTEGER,
        address TEXT,
        email TEXT,
        phone TEXT,
        city TEXT,
        district TEXT
    )`, (err) => {
        // If table exists but address column missing, we should try to add it.
        // However, sqlite "IF NOT EXISTS" won't run if table exists.
        // We try to add column separately.
        if (!err) {
            db.run("ALTER TABLE users ADD COLUMN address TEXT", (err) => { });
            db.run("ALTER TABLE users ADD COLUMN email TEXT", (err) => { });
            db.run("ALTER TABLE users ADD COLUMN phone TEXT", (err) => { });
            db.run("ALTER TABLE users ADD COLUMN city TEXT", (err) => { });
            db.run("ALTER TABLE users ADD COLUMN district TEXT", (err) => { });
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price REAL,
        image TEXT,
        description TEXT,
        category TEXT,
        type TEXT,
        subtype TEXT,
        colors TEXT,
        reviews TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total REAL,
        status TEXT,
        estimated_delivery TEXT,
        items TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migrate Users
    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (!err && row.count === 0 && fs.existsSync(USERS_FILE)) {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            const stmt = db.prepare("INSERT OR IGNORE INTO users (id, username, password, isAdmin) VALUES (?, ?, ?, ?)");
            users.forEach(u => {
                stmt.run(u.id, u.username, u.password, u.isAdmin ? 1 : 0);
            });
            stmt.finalize(() => console.log("Users migrated."));
        } else if (!err && row.count === 0) {
            db.run("INSERT INTO users (username, password, isAdmin) VALUES ('admin', '123', 1)");
        }
    });

    // Migrate Products
    db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (!err && row.count === 0 && fs.existsSync(DATA_FILE)) {
            const products = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            const stmt = db.prepare("INSERT OR IGNORE INTO products (id, name, price, image, description, category, type, subtype, colors, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            products.forEach(p => {
                stmt.run(p.id, p.name, p.price, p.image, p.description, p.category, p.type, p.subtype, JSON.stringify(p.colors || []), JSON.stringify(p.reviews || []));
            });
            stmt.finalize(() => console.log("Products migrated."));
        }
    });
});

const parseProduct = (p) => {
    if (!p) return null;
    return {
        ...p,
        colors: JSON.parse(p.colors || '[]'),
        reviews: JSON.parse(p.reviews || '[]')
    };
};

/* --- PRODUCTS API --- */

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(parseProduct));
    });
});

app.get('/api/products/:id', (req, res) => {
    db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json(parseProduct(row));
        else res.status(404).json({ error: "Product not found" });
    });
});

app.post('/api/products', (req, res) => {
    const { name, price, image, description, category, type, subtype, colors, reviews } = req.body;
    const sql = `INSERT INTO products (name, price, image, description, category, type, subtype, colors, reviews) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, price, image, description, category, type, subtype, JSON.stringify(colors || []), JSON.stringify(reviews || [])];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

app.put('/api/products/:id', (req, res) => {
    db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ error: "Not found" });

        const current = parseProduct(row);
        const updated = { ...current, ...req.body };

        const sql = `UPDATE products SET name=?, price=?, image=?, description=?, category=?, type=?, subtype=?, colors=?, reviews=? WHERE id=?`;
        const params = [updated.name, updated.price, updated.image, updated.description, updated.category, updated.type, updated.subtype, JSON.stringify(updated.colors), JSON.stringify(updated.reviews), req.params.id];

        db.run(sql, params, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(updated);
        });
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

/* --- AUTH API --- */

app.post('/api/register', (req, res) => {
    const { username, password, email } = req.body;
    const sql = "INSERT INTO users (username, password, isAdmin, email) VALUES (?, ?, 0, ?)";
    db.run(sql, [username, password, email], function (err) {
        if (err) {
            return res.status(400).json({ message: "Bu kullanıcı adı dolu." });
        }
        res.json({ success: true, user: { id: this.lastID, username, password, isAdmin: false, email } });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, user: { id: row.id, username: row.username, isAdmin: !!row.isAdmin, email: row.email } });
        } else {
            res.status(401).json({ success: false, message: "Hatalı kullanıcı adı veya şifre" });
        }
    });
});

/* --- USER & ORDER API --- */

app.get('/api/users/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT id, username, isAdmin, address, email, phone, city, district FROM users WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json({ ...row, isAdmin: !!row.isAdmin });
        else res.status(404).json({ error: "User not found" });
    });
});

app.post('/api/profile', (req, res) => {
    const { id, address, username, email, phone, city, district } = req.body;

    // Dynamic update query
    let fields = [];
    let params = [];
    if (address !== undefined) { fields.push("address = ?"); params.push(address); }
    if (username !== undefined) { fields.push("username = ?"); params.push(username); }
    if (email !== undefined) { fields.push("email = ?"); params.push(email); }
    if (phone !== undefined) { fields.push("phone = ?"); params.push(phone); }
    if (city !== undefined) { fields.push("city = ?"); params.push(city); }
    if (district !== undefined) { fields.push("district = ?"); params.push(district); }

    if (fields.length === 0) return res.json({ success: true });

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        // Return updated fields
        res.json({ success: true, changes: this.changes });
    });
});

app.get('/api/users', (req, res) => {
    // Ideally authentication check here, but relying on frontend redirect for now
    db.all("SELECT id, username, email, isAdmin, address FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(row => ({ ...row, isAdmin: !!row.isAdmin })));
    });
});

app.get('/api/orders', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });

    db.all("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const orders = rows.map(o => ({
            ...o,
            items: JSON.parse(o.items || '[]')
        }));
        res.json(orders);
    });
});

app.post('/api/orders', (req, res) => {
    const { userId, total, items, address } = req.body;
    const status = "Hazırlanıyor";
    // Estimated delivery: 3 days later
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const estimated_delivery = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const sql = `INSERT INTO orders (user_id, total, status, estimated_delivery, items, address) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [userId, total, status, estimated_delivery, JSON.stringify(items), address];

    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, orderId: this.lastID });
    });
});

/* --- RETURNS API --- */

app.post('/api/returns', (req, res) => {
    const { userId, orderId, productName, type, reason } = req.body;
    const sql = `INSERT INTO returns (user_id, order_id, product_name, type, reason) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, orderId, productName, type, reason], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.get('/api/returns', (req, res) => {
    // If admin (no userId param), return all. If userId, return filters.
    // For simplicity, we just return all or filter if query param exists.
    const userId = req.query.userId;
    let sql = "SELECT * FROM returns ORDER BY created_at DESC";
    let params = [];

    if (userId) {
        sql = "SELECT * FROM returns WHERE user_id = ? ORDER BY created_at DESC";
        params = [userId];
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/returns/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE returns SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Deprecated simple pay but kept for compatibility testing if needed
app.post('/api/pay', (req, res) => {
    res.json({ success: true, message: "Ödeme başarıyla alındı." });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT} aktif. (SQLite)`));