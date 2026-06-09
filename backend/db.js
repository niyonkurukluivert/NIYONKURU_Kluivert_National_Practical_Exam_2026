// backend/db.js
const mysql = require('mysql2/promise');

// MySQL database configuration for XAMPP
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'SRMS',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Connection pool
const pool = mysql.createPool(dbConfig);

module.exports = {
    pool,
    dbConfig
};
