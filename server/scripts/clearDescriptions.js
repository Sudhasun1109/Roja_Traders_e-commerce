const db = require('../config/db');

async function clearDescriptions() {
  try {
    const [res] = await db.query("UPDATE products SET description = ''");
    console.log('Successfully cleared descriptions for all products. Affected rows:', res.affectedRows);
    process.exit(0);
  } catch (err) {
    console.error('Error clearing descriptions:', err);
    process.exit(1);
  }
}

clearDescriptions();
