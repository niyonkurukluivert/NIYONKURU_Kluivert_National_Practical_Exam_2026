// backend/server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS config (allows credential passing for session cookies)
app.use(cors({
    origin: 'http://localhost:5173', // Vite standard port
    credentials: true
}));

// Session config
app.use(session({
    secret: 'dab_enterprise_kigali_secret_2026_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true if running HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Auth checking middleware
function requireAuth(req, res, next) {
    if (!req.session.username) {
        return res.status(401).json({ error: 'Unauthorized: Please sign in.' });
    }
    next();
}

// ==========================================
// 1. Authentication Routes
// ==========================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Please enter both username and password.' });
    }
    
    try {
        const [rows] = await pool.query("SELECT username, password FROM users WHERE username = ?", [username]);
        const user = rows[0];
        
        if (user && bcrypt.compareSync(password, user['password'])) {
            req.session.username = user.username;
            res.json({ success: true, username: user.username });
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error occurred during login.' });
    }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to destroy session.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully.' });
    });
});

// GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
    if (req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not logged in.' });
    }
});

// ==========================================
// 2. Dashboard Routes
// ==========================================

// GET /api/dashboard
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        // Fetch stats
        const [[{ totalItems }]] = await pool.query("SELECT COUNT(*) as totalItems FROM items");
        const [[{ lowStock }]] = await pool.query("SELECT COUNT(*) as lowStock FROM items WHERE quantity < 10");
        const [[{ totalSales }]] = await pool.query("SELECT COUNT(*) as totalSales FROM sales");
        const [[{ totalRevenue }]] = await pool.query("SELECT SUM(totalprice) as totalRevenue FROM sales");
        
        // Fetch 5 latest sales
        const [recentSales] = await pool.query(`
            SELECT s.sale_id, s.saledate, s.customername, s.totalprice, s.username,
                   (SELECT COUNT(*) FROM saledetail WHERE sale_id = s.sale_id) as items_count
            FROM sales s
            ORDER BY s.saledate DESC
            LIMIT 5
        `);
        
        res.json({
            stats: {
                totalItems,
                lowStock,
                totalSales,
                totalRevenue: totalRevenue || 0.00
            },
            recentSales
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve dashboard stats.' });
    }
});

// ==========================================
// 3. Items (Stock) CRUD Routes
// ==========================================

// GET /api/items (Search & List)
app.get('/api/items', requireAuth, async (req, res) => {
    const { search } = req.query;
    try {
        if (search) {
            const queryTerm = `%${search}%`;
            const [rows] = await pool.query(
                "SELECT * FROM items WHERE itemname LIKE ? OR specification LIKE ? ORDER BY itemname ASC",
                [queryTerm, queryTerm]
            );
            res.json(rows);
        } else {
            const [rows] = await pool.query("SELECT * FROM items ORDER BY itemname ASC");
            res.json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve items.' });
    }
});

// POST /api/items (Create)
app.post('/api/items', requireAuth, async (req, res) => {
    const { itemname, specification, unitmeasure, quantity, unitprice, totalquantity } = req.body;
    
    if (!itemname || !unitmeasure || quantity === undefined || unitprice === undefined) {
        return res.status(400).json({ error: 'Missing required item fields.' });
    }
    
    const qty = parseInt(quantity);
    const price = parseFloat(unitprice);
    const totalQty = totalquantity !== undefined ? parseInt(totalquantity) : qty;
    
    if (qty < 0 || price < 0 || totalQty < 0) {
        return res.status(400).json({ error: 'Quantities and prices must be non-negative.' });
    }
    
    try {
        const [result] = await pool.query(
            "INSERT INTO items (itemname, specification, unitmeasure, quantity, unitprice, totalquantity) VALUES (?, ?, ?, ?, ?, ?)",
            [itemname, specification || '', unitmeasure, qty, price, totalQty]
        );
        res.status(201).json({ success: true, item_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `An item with the name '${itemname}' already exists.` });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to add item.' });
    }
});

// PUT /api/items/:id (Update)
app.put('/api/items/:id', requireAuth, async (req, res) => {
    const itemId = req.params.id;
    const { itemname, specification, unitmeasure, quantity, unitprice, totalquantity } = req.body;
    
    if (!itemname || !unitmeasure || quantity === undefined || unitprice === undefined) {
        return res.status(400).json({ error: 'Missing required item fields.' });
    }
    
    const qty = parseInt(quantity);
    const price = parseFloat(unitprice);
    const totalQty = totalquantity !== undefined ? parseInt(totalquantity) : qty;
    
    if (qty < 0 || price < 0 || totalQty < 0) {
        return res.status(400).json({ error: 'Quantities and prices must be non-negative.' });
    }
    
    try {
        await pool.query(
            "UPDATE items SET itemname = ?, specification = ?, unitmeasure = ?, quantity = ?, unitprice = ?, totalquantity = ? WHERE item_id = ?",
            [itemname, specification || '', unitmeasure, qty, price, totalQty, itemId]
        );
        res.json({ success: true, message: 'Item updated successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `An item with the name '${itemname}' already exists.` });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to update item.' });
    }
});

// DELETE /api/items/:id (Delete)
app.delete('/api/items/:id', requireAuth, async (req, res) => {
    const itemId = req.params.id;
    try {
        // Check if there are sales records linking this item
        const [salesCheck] = await pool.query("SELECT COUNT(*) as count FROM saledetail WHERE item_id = ?", [itemId]);
        if (salesCheck[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete item as it has associated sales records.' });
        }
        
        await pool.query("DELETE FROM items WHERE item_id = ?", [itemId]);
        res.json({ success: true, message: 'Item deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete item.' });
    }
});

// ==========================================
// 4. Sales Recording Routes
// ==========================================

// POST /api/sales (Record Sale as a Transaction)
app.post('/api/sales', requireAuth, async (req, res) => {
    const { customername, saledate, cart_items } = req.body;
    const username = req.session.username;
    
    if (!customername || !cart_items || cart_items.length === 0) {
        return res.status(400).json({ error: 'Please provide customer name and at least one item.' });
    }
    
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        
        // 1. Create Sale header
        const formattedDate = saledate ? new Date(saledate) : new Date();
        const [saleResult] = await conn.query(
            "INSERT INTO sales (saledate, customername, totalprice, username) VALUES (?, ?, 0, ?)",
            [formattedDate, customername, username]
        );
        const saleId = saleResult.insertId;
        
        let runningTotal = 0;
        
        // 2. Loop through cart items and subtract inventory
        for (const item of cart_items) {
            const itemId = parseInt(item.item_id);
            const qtySold = parseInt(item.quantity);
            
            // Fetch and lock item stock details
            const [rows] = await conn.query("SELECT itemname, quantity, unitprice FROM items WHERE item_id = ? FOR UPDATE", [itemId]);
            const dbItem = rows[0];
            
            if (!dbItem) {
                throw new Error(`Item ID ${itemId} not found.`);
            }
            
            if (dbItem.quantity < qtySold) {
                throw new Error(`Insufficient stock for '${dbItem.itemname}'. Only ${dbItem.quantity} units left, but attempted to sell ${qtySold}.`);
            }
            
            // Calculate subtotal
            const subtotal = qtySold * parseFloat(dbItem.unitprice);
            runningTotal += subtotal;
            
            // Subtract stock
            await conn.query("UPDATE items SET quantity = quantity - ? WHERE item_id = ?", [qtySold, itemId]);
            
            // Insert saledetail record
            await conn.query(
                "INSERT INTO saledetail (sale_id, item_id, quantitysold, subtotalprice) VALUES (?, ?, ?, ?)",
                [saleId, itemId, qtySold, subtotal]
            );
        }
        
        // 3. Update totalprice in sale header
        await conn.query("UPDATE sales SET totalprice = ? WHERE sale_id = ?", [runningTotal, saleId]);
        
        await conn.commit();
        res.status(201).json({ success: true, sale_id: saleId, total: runningTotal });
        
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to complete sales transaction.' });
    } finally {
        conn.release();
    }
});

// ==========================================
// 5. Reports Route
// ==========================================

// GET /api/reports (Join query with date & keyword search)
app.get('/api/reports', requireAuth, async (req, res) => {
    const { search, start_date, end_date } = req.query;
    
    let sql = `
        SELECT sd.quantitysold, sd.subtotalprice, s.saledate, s.customername, 
               i.itemname, i.specification, i.unitmeasure, i.unitprice
        FROM saledetail sd
        JOIN sales s ON sd.sale_id = s.sale_id
        JOIN items i ON sd.item_id = i.item_id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
        sql += " AND (i.itemname LIKE ? OR s.customername LIKE ? OR i.specification LIKE ?)";
        const term = `%${search}%`;
        params.push(term, term, term);
    }
    
    if (start_date) {
        sql += " AND s.saledate >= ?";
        params.push(`${start_date} 00:00:00`);
    }
    
    if (end_date) {
        sql += " AND s.saledate <= ?";
        params.push(`${end_date} 23:59:59`);
    }
    
    sql += " ORDER BY s.saledate DESC";
    
    try {
        const [rows] = await pool.query(sql, params);
        
        // Compute sum of all filtered sales
        const grandTotal = rows.reduce((acc, row) => acc + parseFloat(row.subtotalprice), 0);
        
        res.json({
            report: rows,
            grandTotal
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve reports.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Express API Server running on port ${PORT}`);
});
