require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "permis",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log("✓ Connecté à MariaDB");
        conn.release();
    })
    .catch(err => {
        console.error("✗ Erreur connexion DB:", err.message);
    });

module.exports = pool;