// backend/setup_db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { dbConfig } = require('./db');

async function runSetup() {
    console.log("Starting database setup via Node.js...");
    
    // Connect to MySQL server without selecting database
    const conn = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
    });

    try {
        console.log(`Creating database ${dbConfig.database} if not exists...`);
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log("Database created/confirmed.");
        
        // Select database
        await conn.query(`USE \`${dbConfig.database}\`;`);
        
        // Create users table
        console.log("Creating 'users' table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(50) PRIMARY KEY,
                password VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB;
        `);
        
        // Create items table
        console.log("Creating 'items' table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS items (
                item_id INT AUTO_INCREMENT PRIMARY KEY,
                itemname VARCHAR(100) NOT NULL UNIQUE,
                specification TEXT,
                unitmeasure VARCHAR(50) NOT NULL,
                quantity INT NOT NULL DEFAULT 0,
                unitprice DECIMAL(12,2) NOT NULL,
                totalquantity INT NOT NULL DEFAULT 0
            ) ENGINE=InnoDB;
        `);
        
        // Create sales table
        console.log("Creating 'sales' table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS sales (
                sale_id INT AUTO_INCREMENT PRIMARY KEY,
                saledate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                customername VARCHAR(150) NOT NULL,
                totalprice DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                username VARCHAR(50) NOT NULL,
                FOREIGN KEY (username) REFERENCES users(username) ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB;
        `);
        
        // Create saledetail table
        console.log("Creating 'saledetail' table...");
        await conn.query(`
            CREATE TABLE IF NOT EXISTS saledetail (
                saledetail_id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                item_id INT NOT NULL,
                quantitysold INT NOT NULL,
                subtotalprice DECIMAL(12,2) NOT NULL,
                FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES items(item_id) ON UPDATE CASCADE ON DELETE RESTRICT
            ) ENGINE=InnoDB;
        `);
        
        console.log("Tables created successfully.");
        
        // Seed users
        console.log("Checking/Seeding default users...");
        const [users] = await conn.query("SELECT COUNT(*) as count FROM users");
        if (users[0].count === 0) {
            const adminPass = bcrypt.hashSync('admin123', 10);
            const salesPass = bcrypt.hashSync('sales123', 10);
            
            await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", ['admin', adminPass]);
            await conn.query("INSERT INTO users (username, password) VALUES (?, ?)", ['salesperson', salesPass]);
            console.log("Default accounts created: \n - admin (admin123)\n - salesperson (sales123)");
        } else {
            console.log("User accounts already seeded.");
        }
        
        // Seed items
        console.log("Checking/Seeding mock items...");
        const [items] = await conn.query("SELECT COUNT(*) as count FROM items");
        if (items[0].count === 0) {
            const mockItems = [
                ['Cement', 'Dangote Portland Cement 42.5R', 'Bag', 100, 12500.00, 100],
                ['Iron Bars', 'Deformed Steel Bars 12mm x 12m', 'Piece', 50, 8500.00, 50],
                ['Paint', 'Amaco Weatherguard Wall Paint White 20L', 'Bucket', 30, 45000.00, 30],
                ['Steel Nails', '3 inch building nails', 'Kg', 80, 1500.00, 80],
                ['Bricks', 'Clay baked red bricks standard', 'Piece', 1000, 150.00, 1000],
                ['River Sand', 'Fine grain construction sand', 'Ton', 10, 60000.00, 10]
            ];
            
            for (const item of mockItems) {
                await conn.query("INSERT INTO items (itemname, specification, unitmeasure, quantity, unitprice, totalquantity) VALUES (?, ?, ?, ?, ?, ?)", item);
            }
            console.log("Mock items successfully seeded.");
        } else {
            console.log("Items inventory already seeded.");
        }
        
        // Seed sales
        console.log("Checking/Seeding mock sales...");
        const [sales] = await conn.query("SELECT COUNT(*) as count FROM sales");
        if (sales[0].count === 0) {
            // Sale 1
            await conn.query("INSERT INTO sales (saledate, customername, totalprice, username) VALUES ('2026-06-08 10:15:00', 'Kamil Limited', 220000.00, 'admin')");
            const saleId1 = (await conn.query("SELECT LAST_INSERT_ID() as id"))[0][0].id;
            
            // Find item IDs
            const [[cement]] = await conn.query("SELECT item_id FROM items WHERE itemname = 'Cement'");
            const [[sand]] = await conn.query("SELECT item_id FROM items WHERE itemname = 'River Sand'");
            
            // Details
            await conn.query("INSERT INTO saledetail (sale_id, item_id, quantitysold, subtotalprice) VALUES (?, ?, 8, 100000.00)", [saleId1, cement.item_id]);
            await conn.query("INSERT INTO saledetail (sale_id, item_id, quantitysold, subtotalprice) VALUES (?, ?, 2, 120000.00)", [saleId1, sand.item_id]);
            
            // Adjust stock
            await conn.query("UPDATE items SET quantity = quantity - 8 WHERE item_id = ?", [cement.item_id]);
            await conn.query("UPDATE items SET quantity = quantity - 2 WHERE item_id = ?", [sand.item_id]);

            // Sale 2
            await conn.query("INSERT INTO sales (saledate, customername, totalprice, username) VALUES ('2026-06-09 09:30:00', 'Mugisha Christian', 54000.00, 'salesperson')");
            const saleId2 = (await conn.query("SELECT LAST_INSERT_ID() as id"))[0][0].id;
            
            const [[nails]] = await conn.query("SELECT item_id FROM items WHERE itemname = 'Steel Nails'");
            const [[paint]] = await conn.query("SELECT item_id FROM items WHERE itemname = 'Paint'");
            
            await conn.query("INSERT INTO saledetail (sale_id, item_id, quantitysold, subtotalprice) VALUES (?, ?, 6, 9000.00)", [saleId2, nails.item_id]);
            await conn.query("INSERT INTO saledetail (sale_id, item_id, quantitysold, subtotalprice) VALUES (?, ?, 1, 45000.00)", [saleId2, paint.item_id]);
            
            // Adjust stock
            await conn.query("UPDATE items SET quantity = quantity - 6 WHERE item_id = ?", [nails.item_id]);
            await conn.query("UPDATE items SET quantity = quantity - 1 WHERE item_id = ?", [paint.item_id]);
            
            console.log("Mock sales successfully seeded.");
        } else {
            console.log("Sales transactions already seeded.");
        }
        
        console.log("Database initialization completed successfully!");
        
    } catch (err) {
        console.error("Error during DB setup:", err);
    } finally {
        await conn.end();
    }
}

if (require.main === module) {
    runSetup();
}

module.exports = runSetup;
