const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runSeed() {
  console.log('🔄 Running database migrations and seeds...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true
  });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'seed.sql'), 'utf8');

    console.log('Applying database schema...');
    await connection.query(schemaSql);

    console.log('Applying seed data...');
    await connection.query(seedSql);

    console.log('✅ Database schema and seed data successfully initialized!');
  } catch (error) {
    console.error('❌ Error executing database seed:', error.message);
  } finally {
    await connection.end();
  }
}

runSeed();
