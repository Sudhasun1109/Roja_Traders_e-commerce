const pool = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();
  try {
    console.log('🚀 Running Invoice System Migration...');

    // 1. Check & add invoice_number to enquiries
    const [eCols] = await connection.execute("SHOW COLUMNS FROM enquiries LIKE 'invoice_number'");
    if (eCols.length === 0) {
      console.log('Adding invoice_number column to enquiries...');
      await connection.execute("ALTER TABLE enquiries ADD COLUMN invoice_number VARCHAR(60) NULL AFTER id");
      await connection.execute("ALTER TABLE enquiries ADD UNIQUE INDEX idx_invoice_number (invoice_number)");
    } else {
      console.log('invoice_number column already exists in enquiries.');
    }

    // 2. Check & add tamil_name to enquiry_items
    const [eiCols] = await connection.execute("SHOW COLUMNS FROM enquiry_items LIKE 'tamil_name'");
    if (eiCols.length === 0) {
      console.log('Adding tamil_name column to enquiry_items...');
      await connection.execute("ALTER TABLE enquiry_items ADD COLUMN tamil_name VARCHAR(255) NULL AFTER product_name");
    } else {
      console.log('tamil_name column already exists in enquiry_items.');
    }

    // 3. Check & add invoice_settings to website_settings
    const [wsCols] = await connection.execute("SHOW COLUMNS FROM website_settings LIKE 'invoice_settings'");
    if (wsCols.length === 0) {
      console.log('Adding invoice_settings column to website_settings...');
      await connection.execute("ALTER TABLE website_settings ADD COLUMN invoice_settings TEXT NULL");
    } else {
      console.log('invoice_settings column already exists in website_settings.');
    }

    // 4. Set default invoice_settings if null
    const [settings] = await connection.execute("SELECT id, website_name, address, contact_number, email, invoice_settings FROM website_settings LIMIT 1");
    if (settings.length > 0) {
      const current = settings[0];
      if (!current.invoice_settings) {
        const defaultInvoiceSettings = {
          company_name: current.website_name || 'Roja Traders',
          invoice_title: 'ORDER BILL / ESTIMATE',
          invoice_prefix: 'RT-INV-',
          tagline: 'Wholesale & Retail Provisions',
          address: current.address || 'Avinash, Tamil Nadu, India',
          contact_number: current.contact_number || '+91 9597993402',
          email: current.email || 'sudhasunt2006@gmail.com',
          gstin: '',
          fssai: '',
          show_tamil_name: true,
          tax_rate: 0,
          tax_label: 'GST / Tax',
          upi_id: '9597993402@upi',
          terms: '1. Goods once sold will not be returned without bill.\n2. Please inspect all items upon receipt.\n3. Thank you for choosing Roja Traders!',
          footer_note: 'Direct WhatsApp Order | Genuine Stock Guaranteed'
        };

        await connection.execute(
          "UPDATE website_settings SET invoice_settings = ? WHERE id = ?",
          [JSON.stringify(defaultInvoiceSettings), current.id]
        );
        console.log('✅ Default invoice_settings saved to website_settings.');
      }
    }

    // 5. Backfill any existing enquiries missing invoice_number
    const [pendingEnquiries] = await connection.execute(
      "SELECT id, created_at FROM enquiries WHERE invoice_number IS NULL OR invoice_number = '' ORDER BY id ASC"
    );

    for (const enq of pendingEnquiries) {
      const year = new Date(enq.created_at || Date.now()).getFullYear();
      const paddedId = String(enq.id).padStart(4, '0');
      const invoiceNo = `RT-INV-${year}-${paddedId}`;
      await connection.execute(
        "UPDATE enquiries SET invoice_number = ? WHERE id = ?",
        [invoiceNo, enq.id]
      );
    }
    console.log(`✅ Backfilled ${pendingEnquiries.length} enquiries with invoice numbers.`);

    console.log('🎉 Invoice system migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    connection.release();
    pool.end();
  }
}

runMigration();
