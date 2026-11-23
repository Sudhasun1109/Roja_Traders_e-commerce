const pool = require('../config/db');

async function runMigration() {
  console.log('🔄 Starting Role-Based Access Control (RBAC) migration...');

  try {
    // 1. Check if 'role' column exists in 'users' table
    const [userCols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'"
    );

    if (userCols.length === 0) {
      console.log("Adding 'role' column to 'users' table...");
      await pool.query(
        "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer' AFTER mobile_number"
      );
      console.log("✅ Added 'role' column to 'users'");
    } else {
      console.log("'role' column already exists in 'users'");
    }

    // 2. Check if 'mobile_number' column exists in 'admins' table
    const [adminCols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'mobile_number'"
    );

    if (adminCols.length === 0) {
      console.log("Adding 'mobile_number' column to 'admins' table...");
      await pool.query(
        "ALTER TABLE admins ADD COLUMN mobile_number VARCHAR(20) DEFAULT NULL AFTER username"
      );
      console.log("✅ Added 'mobile_number' column to 'admins'");
    } else {
      console.log("'mobile_number' column already exists in 'admins'");
    }

    // 3. Update admin records in 'admins'
    await pool.query(
      "UPDATE admins SET mobile_number = '+919876543210' WHERE id = 1"
    );
    console.log("✅ Updated admin id 1 mobile_number to +919876543210");

    // 4. Update 'Sudhasun' user in 'users' to role = 'admin' and sync password with admin123 hash
    const adminPassHash = '$2a$10$w8bgy3VhFzGuTPHDcpVmCem3xs8q0OIAnEgOTwNgkZqV/TgDexjNm'; // 'admin123'
    await pool.query(
      "UPDATE users SET role = 'admin', password = ? WHERE id = 1 OR mobile_number LIKE '%9876543210%'",
      [adminPassHash]
    );
    console.log("✅ Updated user Sudhasun (9876543210) to role = 'admin' with password 'admin123'");

    console.log('🎉 RBAC migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
