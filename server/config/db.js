
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'whatsapp_ecommerce',
  port: parseInt(process.env.DB_PORT || '3306', 10),

  // Enable SSL for TiDB Cloud
  ssl: process.env.DB_HOST
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

async function initDatabaseSchema() {
  try {
    const connection = await pool.getConnection();
    console.log('🔄 Checking and verifying database schema columns...');

    // 1. Ensure 'role' in 'users'
    try {
      const [userCols] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'"
      );
      if (userCols.length === 0) {
        console.log("➕ Adding 'role' column to 'users' table...");
        await connection.query("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer' AFTER mobile_number");
        console.log("✅ Added 'role' column to 'users'");
      }
    } catch (colErr) {
      console.warn("⚠️ Check/add 'role' in users:", colErr.message);
    }

    // 2. Ensure 'mobile_number' in 'admins'
    try {
      const [adminCols] = await connection.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'mobile_number'"
      );
      if (adminCols.length === 0) {
        console.log("➕ Adding 'mobile_number' column to 'admins' table...");
        await connection.query("ALTER TABLE admins ADD COLUMN mobile_number VARCHAR(20) DEFAULT NULL AFTER username");
        console.log("✅ Added 'mobile_number' column to 'admins'");
      }
    } catch (colErr) {
      console.warn("⚠️ Check/add 'mobile_number' in admins:", colErr.message);
    }

    // 3. Ensure index on admins (mobile_number)
    try {
      await connection.query("CREATE INDEX idx_admins_mobile ON admins (mobile_number)");
    } catch (idxErr) {
      // index already exists or not supported
    }

    // 4. Default admin mobile fallback if null
    try {
      await connection.query("UPDATE admins SET mobile_number = '+919876543210' WHERE id = 1 AND (mobile_number IS NULL OR mobile_number = '')");
    } catch (upErr) {
      // ignore
    }

    connection.release();
    console.log('✅ Database schema verified and up to date.');
  } catch (error) {
    console.error('❌ Schema initialization error:', error.message);
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log(
      '✅ Connected successfully to MySQL database:',
      process.env.DB_NAME
    );

    connection.release();

    // Run auto-migration check immediately after connecting
    await initDatabaseSchema();
  } catch (error) {
    console.error(
      '❌ Failed to connect to MySQL database:',
      error.message
    );
  }
}

testConnection();

pool.initDatabaseSchema = initDatabaseSchema;
module.exports = pool;
