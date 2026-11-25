const pool = require('../server/config/db');

async function testStockFlow() {
  console.log('====================================================');
  console.log('🔄 STARTING COMPREHENSIVE STOCK FLOW VERIFICATION');
  console.log('====================================================');
  
  // 1. Pick product 1
  const [pRows] = await pool.query('SELECT id, product_name, price, stock_quantity FROM products WHERE id = 1');
  const initialStock = pRows[0].stock_quantity;
  const price = parseFloat(pRows[0].price);
  console.log(`[STEP 1] Initial Product 1 (${pRows[0].product_name}): Stock = ${initialStock}, Price = ₹${price}`);

  // Calculate quantity to exceed minimum order of ₹200
  const qty = Math.max(2, Math.ceil(200 / price));
  console.log(`[STEP 2] Placing customer order for quantity: ${qty} units...`);

  // 2. Place order via API
  const orderRes = await fetch('http://localhost:5000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 1, quantity: qty }],
      customerName: 'Stock Flow Test Customer',
      customerMobile: '9876543210'
    })
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  }
  
  const { invoiceNumber, enquiryId } = orderData.data;
  console.log(`[STEP 2] ✅ Order created successfully. Invoice: ${invoiceNumber}, Enquiry ID: ${enquiryId}`);

  // 3. Verify stock reduced in DB
  const [pAfterOrder] = await pool.query('SELECT stock_quantity FROM products WHERE id = 1');
  const stockAfterOrder = pAfterOrder[0].stock_quantity;
  console.log(`[STEP 3] Stock after order placement: ${stockAfterOrder} (Expected: ${initialStock - qty})`);
  if (stockAfterOrder !== initialStock - qty) {
    throw new Error(`FAILED: Stock was not reduced after order! Got ${stockAfterOrder}, expected ${initialStock - qty}`);
  }
  console.log('  ✔ PASS: Product stock was decremented accurately on order placement!');

  // 4. Verify stock_history audit entry
  const [histRows] = await pool.query('SELECT * FROM stock_history WHERE product_id = 1 ORDER BY id DESC LIMIT 1');
  console.log(`[STEP 4] Audit record: type="${histRows[0].change_type}", prev=${histRows[0].previous_stock}, updated=${histRows[0].updated_stock}`);
  console.log(`         Note: "${histRows[0].notes}"`);
  if (histRows[0].change_type !== 'decrease' || histRows[0].updated_stock !== stockAfterOrder) {
    throw new Error('FAILED: stock_history does not match expected decrease audit entry!');
  }
  console.log('  ✔ PASS: stock_history table accurately recorded the decrease audit trail!');

  // 5. Test Admin Login and Status update to 'cancelled' (stock restoration)
  const adminLoginRes = await fetch('http://localhost:5000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.data.token;
  console.log('[STEP 5] Admin authenticated. Updating enquiry status to "cancelled"...');

  const cancelRes = await fetch(`http://localhost:5000/api/admin/enquiries/${enquiryId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      enquiry_status: 'cancelled',
      notes: 'Testing cancellation stock restoration'
    })
  });
  if (!cancelRes.ok) throw new Error('Status update failed');

  const [pAfterCancel] = await pool.query('SELECT stock_quantity FROM products WHERE id = 1');
  console.log(`[STEP 5] Stock after cancellation: ${pAfterCancel[0].stock_quantity} (Expected: ${initialStock})`);
  if (pAfterCancel[0].stock_quantity !== initialStock) {
    throw new Error(`FAILED: Stock was not restored on cancellation! Got ${pAfterCancel[0].stock_quantity}, expected ${initialStock}`);
  }
  console.log('  ✔ PASS: Stock was accurately restored to initial inventory on order cancellation!');

  // 6. Test re-activating back to 'pending' (re-deducts)
  console.log('[STEP 6] Admin re-activating enquiry back to "pending"...');
  await fetch(`http://localhost:5000/api/admin/enquiries/${enquiryId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      enquiry_status: 'pending'
    })
  });
  const [pAfterReactivate] = await pool.query('SELECT stock_quantity FROM products WHERE id = 1');
  console.log(`[STEP 6] Stock after reactivating: ${pAfterReactivate[0].stock_quantity} (Expected: ${initialStock - qty})`);
  if (pAfterReactivate[0].stock_quantity !== initialStock - qty) {
    throw new Error('FAILED: Stock was not re-deducted on reactivation!');
  }
  console.log('  ✔ PASS: Stock was accurately re-deducted on order reactivation!');

  // 7. Test delete enquiry (restores stock)
  console.log('[STEP 7] Admin deleting active enquiry...');
  await fetch(`http://localhost:5000/api/admin/enquiries/${enquiryId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });
  const [pAfterDelete] = await pool.query('SELECT stock_quantity FROM products WHERE id = 1');
  console.log(`[STEP 7] Stock after order deletion: ${pAfterDelete[0].stock_quantity} (Expected: ${initialStock})`);
  if (pAfterDelete[0].stock_quantity !== initialStock) {
    throw new Error('FAILED: Stock was not restored on order deletion!');
  }
  console.log('  ✔ PASS: Stock was accurately restored to inventory on order deletion!');

  console.log('====================================================');
  console.log('🎉 COMPLETE STOCK FLOW VERIFIED: 100% OPERATIONAL!');
  console.log('====================================================');
  process.exit(0);
}

testStockFlow().catch(err => {
  console.error('TEST ERROR:', err.message);
  process.exit(1);
});
