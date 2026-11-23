const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function updateName() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'whatsapp_ecommerce'
  });

  try {
    await connection.query(
      `UPDATE website_settings SET
         website_name = 'Roja Traders',
         logo_url = '/logo-rt.svg',
         footer_text = '© 2026 Roja Traders. All rights reserved.'
       WHERE id = 1`
    );
    console.log('✅ Updated website_settings in MySQL to Roja Traders');
  } catch (err) {
    console.error('❌ Error updating settings:', err);
  } finally {
    await connection.end();
  }
}

updateName();
