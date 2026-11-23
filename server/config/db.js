
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
    ? { minVersion: 'TLSv1.2' }
    : undefined,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log(
      '✅ Connected successfully to MySQL database:',
      process.env.DB_NAME
    );

    connection.release();
  } catch (error) {
    console.error(
      '❌ Failed to connect to MySQL database:',
      error.message
    );
  }
}

testConnection();

module.exports = pool;
