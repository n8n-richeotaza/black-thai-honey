require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'noir-secret-key-2026';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_HASH || bcrypt.hashSync('admin123', 10);

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Ensure directories exist
['data', 'public/images'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Database
const db = new sqlite3.Database(path.join(__dirname, 'data', 'noir.db'));

db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        original_price REAL,
        image TEXT,
        badge TEXT,
        rating REAL DEFAULT 5.0,
        reviews INTEGER DEFAULT 0,
        description TEXT,
        features TEXT,
        stock INTEGER DEFAULT 50,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        address TEXT,
        city TEXT,
        zip TEXT,
        total REAL NOT NULL,
        shipping REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        items TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Newsletter subscribers
    db.run(`CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Contact messages
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Seed products if empty
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
        if (row && row.count === 0) {
            seedProducts();
        }
    });
});

function seedProducts() {
    const products = [
        // Single Packs
        { name: "BTH Gold Single Pack", slug: "bth-gold-single", category: "single-packs", price: 12.99, original_price: 15.99, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=BTH+Gold+Single", badge: "Best Seller", rating: 4.9, reviews: 2847, description: "Signature black thai honey pack. Pure Thai forest honey with ginseng and tongkat ali. Trusted by over 50,000 men.", features: JSON.stringify(["Pure Thai black forest honey","Ginseng and tongkat ali","Fast acting within 45 minutes","Discreet single sachet pack"]), stock: 180 },
        { name: "BTH Platinum Single Pack", slug: "bth-platinum-single", category: "single-packs", price: 16.99, image: "https://placehold.co/600x600/0a0a0a/d4b87a?text=BTH+Platinum", badge: "New", rating: 4.8, reviews: 412, description: "Extra strength black thai honey with royal jelly and maca root. Maximum potency in every pack.", features: JSON.stringify(["2x potency formula","Royal jelly and maca root","Extended duration benefits","Triple sealed freshness"]), stock: 95 },
        { name: "BTH Midnight Single Pack", slug: "bth-midnight-single", category: "single-packs", price: 11.99, image: "https://placehold.co/600x600/0a0a0a/b8a060?text=BTH+Midnight", badge: null, rating: 4.7, reviews: 1563, description: "Budget friendly black thai honey alternative. Same trusted ingredients, simpler packaging.", features: JSON.stringify(["All natural Thai honey","Standard ginseng blend","Economy single pack","Best value per dose"]), stock: 220 },
        { name: "BTH Gold Max Single Pack", slug: "bth-gold-max-single", category: "single-packs", price: 19.99, original_price: 24.99, image: "https://placehold.co/600x600/0a0a0a/e8c96a?text=BTH+Gold+Max", badge: "Limited", rating: 4.9, reviews: 892, description: "Strongest single pack in our lineup. Maximum dose black thai honey for experienced users only.", features: JSON.stringify(["Maximum strength formula","Proprietary herbal complex","Lab tested purity","Batch numbered"]), stock: 45 },
        // Boxes
        { name: "BTH Gold 3-Pack Box", slug: "bth-gold-3pack", category: "boxes", price: 29.99, original_price: 38.97, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Gold+3-Pack", badge: "Popular", rating: 4.9, reviews: 3215, description: "Best selling box. Three black thai honey packs in premium gift box. Save 23% versus singles.", features: JSON.stringify(["3 BTH Gold single packs","Premium matte black gift box","Perfect for first time buyers","Discreet outer shipping carton"]), stock: 120 },
        { name: "BTH Gold 5-Pack Box", slug: "bth-gold-5pack", category: "boxes", price: 44.99, original_price: 64.95, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Gold+5-Pack", badge: "Best Value", rating: 4.9, reviews: 1847, description: "Smarter choice for regular users. Five packs with deepest discount. Free expedited shipping.", features: JSON.stringify(["5 BTH Gold single packs","31% savings vs singles","Free expedited shipping","Reusable magnetic box"]), stock: 85 },
        { name: "BTH Gold 10-Pack Box", slug: "bth-gold-10pack", category: "boxes", price: 79.99, original_price: 129.90, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Gold+10-Pack", badge: "VIP", rating: 4.8, reviews: 756, description: "VIP box with ten premium packs. Includes free BTH merchandise and loyalty rewards.", features: JSON.stringify(["10 BTH Gold single packs","38% savings vs singles","Free BTH branded item","Priority customer support"]), stock: 50 },
        { name: "Mixed Variety Box 3-Pack", slug: "bth-mixed-3pack", category: "boxes", price: 34.99, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Mixed+3-Pack", badge: "Sampler", rating: 4.7, reviews: 634, description: "Try the full range. One Gold, one Platinum, one Max. Find your perfect honey pack match.", features: JSON.stringify(["1 Gold + 1 Platinum + 1 Max","Curated tasting variety box","Comparison guide included","Ideal gift for him"]), stock: 60 },
        // Bundles
        { name: "BTH Starter Bundle", slug: "bth-starter-bundle", category: "bundles", price: 39.99, original_price: 54.98, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Starter+Bundle", badge: "Bundle", rating: 4.8, reviews: 1456, description: "Everything for first timers. Two Gold packs plus our BTH Guide booklet with tips and usage advice.", features: JSON.stringify(["2 BTH Gold packs","BTH Usage Guide booklet","Free shipping included","100% satisfaction guarantee"]), stock: 100 },
        { name: "BTH Couples Pack", slug: "bth-couples-pack", category: "bundles", price: 22.99, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Couples+Pack", badge: "Gift", rating: 4.9, reviews: 823, description: "His and Hers bundle. Two complementary honey packs in romantic gift set. The perfect surprise.", features: JSON.stringify(["2 BTH Gold packs","Romantic gift packaging","Handwritten message option","Express delivery available"]), stock: 70 },
        { name: "BTH Monthly Subscription", slug: "bth-monthly-sub", category: "bundles", price: 34.99, original_price: 44.99, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Monthly+Sub", badge: "Subscribe", rating: 4.9, reviews: 2145, description: "Never run out. Monthly delivery of 3 black thai honey packs. Cancel anytime. Save 22%.", features: JSON.stringify(["3 packs delivered monthly","22% recurring discount","Skip or cancel anytime","Subscriber only products"]), stock: 999 },
        { name: "BTH Ultimate Gift Set", slug: "bth-ultimate-gift", category: "bundles", price: 89.99, original_price: 119.97, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Ultimate+Gift", badge: "Premium", rating: 4.9, reviews: 312, description: "Ultimate present. 5 Gold packs, 1 Platinum, branded merch, luxury keepsake box. Most impressive gift.", features: JSON.stringify(["5 Gold + 1 Platinum packs","BTH branded merchandise","Luxury keepsake box","Complimentary express shipping"]), stock: 30 },
        { name: "Bulk Wholesale Pack 30ct", slug: "bth-bulk-30", category: "bundles", price: 249.99, original_price: 389.70, image: "https://placehold.co/600x600/0a0a0a/e0b94f?text=Bulk+30-Pack", badge: "Wholesale", rating: 4.8, reviews: 89, description: "Reseller or stock up option. Thirty BTH Gold packs at wholesale pricing. Contact for custom branding.", features: JSON.stringify(["30 BTH Gold packs","36% bulk discount","Reseller certificate included","Custom branding available"]), stock: 25 }
    ];

    const stmt = db.prepare(`INSERT INTO products 
        (name, slug, category, price, original_price, image, badge, rating, reviews, description, features, stock) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    products.forEach(p => {
        stmt.run(p.name, p.slug, p.category, p.price, p.original_price || null, p.image, p.badge, p.rating, p.reviews, p.description, p.features, p.stock);
    });
    stmt.finalize();
    console.log('Database seeded with', products.length, 'honey pack products');
}

// Auth middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

// Routes

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Get all products
app.get('/api/products', (req, res) => {
    const { category, search, sort, limit = 50 } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (category && category !== 'all') {
        sql += ' AND category = ?';
        params.push(category);
    }
    if (search) {
        sql += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    switch(sort) {
        case 'price-low': sql += ' ORDER BY price ASC'; break;
        case 'price-high': sql += ' ORDER BY price DESC'; break;
        case 'newest': sql += ' ORDER BY created_at DESC'; break;
        case 'rating': sql += ' ORDER BY rating DESC'; break;
        default: sql += ' ORDER BY id ASC';
    }
    
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            try { r.features = JSON.parse(r.features); } catch(e) { r.features = []; }
        });
        res.json(rows);
    });
});

// Get single product
app.get('/api/products/:slug', (req, res) => {
    db.get('SELECT * FROM products WHERE slug = ?', [req.params.slug], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        try { row.features = JSON.parse(row.features); } catch(e) { row.features = []; }
        res.json(row);
    });
});

// Create product (admin)
app.post('/api/products', authenticateToken, (req, res) => {
    const { name, slug, category, price, original_price, image, badge, description, features, stock } = req.body;
    db.run(`INSERT INTO products (name, slug, category, price, original_price, image, badge, description, features, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, slug, category, price, original_price || null, image, badge || null, description, JSON.stringify(features || []), stock || 50],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Product created' });
        }
    );
});

// Update product (admin)
app.put('/api/products/:id', authenticateToken, (req, res) => {
    const { name, slug, category, price, original_price, image, badge, description, features, stock } = req.body;
    db.run(`UPDATE products SET name=?, slug=?, category=?, price=?, original_price=?, image=?, badge=?, description=?, features=?, stock=?
        WHERE id=?`,
        [name, slug, category, price, original_price || null, image, badge || null, description, JSON.stringify(features || []), stock, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Product updated', changes: this.changes });
        }
    );
});

// Delete product (admin)
app.delete('/api/products/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Product deleted', changes: this.changes });
    });
});

// Place order
app.post('/api/orders', (req, res) => {
    const { email, first_name, last_name, address, city, zip, total, shipping, items } = req.body;
    if (!email || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    db.run(`INSERT INTO orders (email, first_name, last_name, address, city, zip, total, shipping, items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, first_name, last_name, address, city, zip, total, shipping, JSON.stringify(items)],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Order placed successfully' });
        }
    );
});

// Get orders (admin)
app.get('/api/orders', authenticateToken, (req, res) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            try { r.items = JSON.parse(r.items); } catch(e) { r.items = []; }
        });
        res.json(rows);
    });
});

// Update order status (admin)
app.patch('/api/orders/:id', authenticateToken, (req, res) => {
    db.run('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order updated' });
    });
});

// Newsletter subscribe
app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    db.run('INSERT OR IGNORE INTO subscribers (email) VALUES (?)', [email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            message: this.changes > 0 ? 'Subscribed successfully' : 'Already subscribed',
            new: this.changes > 0
        });
    });
});

// Contact form
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
    db.run('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
        [name, email, subject || '', message], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Message received' });
    });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });
    if (!bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: 'Login successful' });
});

// Admin dashboard stats
app.get('/api/admin/stats', authenticateToken, (req, res) => {
    db.get('SELECT COUNT(*) as products FROM products', [], (err, products) => {
        db.get('SELECT COUNT(*) as orders FROM orders', [], (err2, orders) => {
            db.get('SELECT COUNT(*) as subscribers FROM subscribers', [], (err3, subscribers) => {
                db.get('SELECT COUNT(*) as messages FROM messages', [], (err4, messages) => {
                    db.get('SELECT SUM(total) as revenue FROM orders', [], (err5, revenue) => {
                        res.json({
                            products: products?.products || 0,
                            orders: orders?.orders || 0,
                            subscribers: subscribers?.subscribers || 0,
                            messages: messages?.messages || 0,
                            revenue: revenue?.revenue || 0
                        });
                    });
                });
            });
        });
    });
});

// Admin messages
app.get('/api/admin/messages', authenticateToken, (req, res) => {
    db.all('SELECT * FROM messages ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Black Thai Honey API running on http://localhost:${PORT}`);
    console.log(`Admin password: ${process.env.ADMIN_HASH ? '(set via env)' : 'admin123'}`);
});
