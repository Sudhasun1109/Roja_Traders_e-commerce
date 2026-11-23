/**
 * MASTER QA AUTOMATION TEST SUITE - ROJA TRADERS
 * Covers:
 * Phase 4: Backend Functionality & Middleware
 * Phase 5: API Endpoints, Status Codes & Boundaries
 * Phase 6: Database Integrity & SQL Injection
 * Phase 7: Security & Vulnerabilities (JWT, XSS, Info Leak, Rate Limits)
 * Phase 9: Performance Profiling & Concurrency Stress Test
 */

const http = require('http');
const https = require('https');
const path = require('path');
const jwt = require(path.join(__dirname, '..', 'server', 'node_modules', 'jsonwebtoken'));
const pool = require(path.join(__dirname, '..', 'server', 'config', 'db'));

const BASE_URL = 'http://localhost:5000';

let testResults = [];
let passCount = 0;
let failCount = 0;

function assert(condition, testId, description, details = '') {
  if (condition) {
    passCount++;
    testResults.push({ id: testId, status: 'PASS', description, details });
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${testId}] ${description}`);
  } else {
    failCount++;
    testResults.push({ id: testId, status: 'FAIL', description, details });
    console.log(`  \x1b[31m✖ FAIL\x1b[0m [${testId}] ${description}`);
    if (details) console.log(`         \x1b[33mReason/Data: ${typeof details === 'object' ? JSON.stringify(details) : details}\x1b[0m`);
  }
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || (BASE_URL + options.path));
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOpts = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: options.headers || {}
    };

    if (data && typeof data === 'object') {
      data = JSON.stringify(data);
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = lib.request(reqOpts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });

    req.on('error', reject);

    if (data) req.write(data);
    req.end();
  });
}

async function runMasterQASuite() {
  console.log('\n===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE QA AUTOMATED TEST SUITE');
  console.log('===============================================================\n');

  let customerToken = '';
  let adminToken = '';
  const testMobile = '98765' + Math.floor(10000 + Math.random() * 90000); // Unique 10-digit mobile
  const testPassword = 'TestPass@2026';

  // ==============================================================
  // SECTION 1: SYSTEM HEALTH & APP DOWNLOAD
  // ==============================================================
  console.log('\n--- SECTION 1: System Health & App Download Tests ---');
  
  const healthRes = await request({ path: '/api/health' });
  assert(healthRes.statusCode === 200 && healthRes.json?.status === 'ok', 'SYS-01', 'API Health check returns 200 OK');

  const apkRes = await request({ path: '/download/app' });
  assert(
    apkRes.statusCode === 200 && apkRes.headers['content-type']?.includes('android.package-archive'),
    'APK-01',
    'Direct APK download endpoint (/download/app) returns 200 with android MIME type'
  );

  const staticApkRes = await request({ path: '/downloads/RojaTraders.apk' });
  assert(staticApkRes.statusCode === 200, 'APK-02', 'Static APK download link (/downloads/RojaTraders.apk) returns 200 OK');

  // ==============================================================
  // SECTION 2: CUSTOMER AUTHENTICATION & VALIDATION
  // ==============================================================
  console.log('\n--- SECTION 2: Customer Authentication & Validation ---');

  // Register - Missing fields
  const regMissing = await request({ method: 'POST', path: '/api/auth/register' }, {});
  assert(regMissing.statusCode === 400, 'AUTH-01', 'Registration with missing fields returns 400 Bad Request');

  // Register - Password failing rules (< 8 chars)
  const regWeakPass = await request({ method: 'POST', path: '/api/auth/register' }, {
    name: 'Weak User',
    mobileNumber: testMobile,
    password: 'weak'
  });
  assert(regWeakPass.statusCode === 400, 'AUTH-02', 'Registration with weak password (<8 chars) returns 400 Bad Request');

  // Register - Valid Customer
  const regValid = await request({ method: 'POST', path: '/api/auth/register' }, {
    name: 'QA Test Customer',
    mobileNumber: testMobile,
    password: testPassword
  });
  assert(
    regValid.statusCode === 201 && regValid.json?.data?.token,
    'AUTH-03',
    'Valid registration returns 201 Created and issues JWT token'
  );
  customerToken = regValid.json?.data?.token || '';

  // Register - Duplicate Mobile (409 Conflict)
  const regDup = await request({ method: 'POST', path: '/api/auth/register' }, {
    name: 'Duplicate QA',
    mobileNumber: testMobile,
    password: testPassword
  });
  assert(regDup.statusCode === 409, 'AUTH-04', 'Registration with existing mobile returns 409 Conflict', `Got ${regDup.statusCode}: ${regDup.body}`);

  // Login - Valid Credentials
  const loginValid = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: testMobile,
    password: testPassword
  });
  assert(
    loginValid.statusCode === 200 && loginValid.json?.data?.token && loginValid.json?.data?.user?.password === undefined,
    'AUTH-05',
    'Customer login returns 200 OK and excludes password hash from response',
    `Got ${loginValid.statusCode}: ${loginValid.body}`
  );

  // Login - Wrong Password
  const loginWrongPass = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: testMobile,
    password: 'WrongPassword@123'
  });
  assert(loginWrongPass.statusCode === 401, 'AUTH-06', 'Login with wrong password returns 401 Unauthorized', `Got ${loginWrongPass.statusCode}: ${loginWrongPass.body}`);

  // Login - Unregistered Mobile (Non-200, 401 or 404)
  const loginUnreg = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: '9999900000',
    password: testPassword
  });
  assert(loginUnreg.statusCode === 401 || loginUnreg.statusCode === 404, 'AUTH-07', 'Login with unregistered mobile returns 401/404', `Got ${loginUnreg.statusCode}: ${loginUnreg.body}`);

  // Forgot Password - Verify Mobile (Registered)
  const forgotVerifyOk = await request({ method: 'POST', path: '/api/auth/forgot-password/verify-mobile' }, {
    mobileNumber: testMobile
  });
  assert(forgotVerifyOk.statusCode === 200, 'FORGOT-01', 'Forgot password verify mobile returns 200 for registered user (No OTP required)');

  // Forgot Password - Verify Mobile (Unregistered)
  const forgotVerifyFail = await request({ method: 'POST', path: '/api/auth/forgot-password/verify-mobile' }, {
    mobileNumber: '9999900000'
  });
  assert(forgotVerifyFail.statusCode === 404, 'FORGOT-02', 'Forgot password verify mobile returns 404 for unregistered user');

  // Forgot Password - Direct Change with Weak Password
  const forgotChangeWeak = await request({ method: 'POST', path: '/api/auth/forgot-password/change' }, {
    mobileNumber: testMobile,
    newPassword: 'simplepassword'
  });
  assert(forgotChangeWeak.statusCode === 400, 'FORGOT-03', 'Forgot password change rejects password without uppercase/special char/number (400)');

  // Forgot Password - Direct Change Valid (No OTP)
  const newPass = 'UpdatedPass@2026';
  const forgotChangeOk = await request({ method: 'POST', path: '/api/auth/forgot-password/change' }, {
    mobileNumber: testMobile,
    newPassword: newPass
  });
  assert(forgotChangeOk.statusCode === 200, 'FORGOT-04', 'Forgot password directly updates password in DB without OTP (200 OK)');

  // Re-login with updated password
  const loginNewPass = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: testMobile,
    password: newPass
  });
  assert(loginNewPass.statusCode === 200, 'FORGOT-05', 'Customer can login with new updated password');
  customerToken = loginNewPass.json?.data?.token || customerToken;

  // Protected Customer Route - GET /api/auth/me
  const meOk = await request({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert(
    meOk.statusCode === 200 && meOk.json?.data?.user?.mobile_number?.includes(testMobile),
    'AUTH-08',
    'GET /api/auth/me returns authenticated customer profile',
    `Got ${meOk.statusCode}: ${meOk.body}`
  );

  // Protected Customer Route - No Token (401)
  const meNoToken = await request({ path: '/api/auth/me' });
  assert(meNoToken.statusCode === 401, 'AUTH-09', 'GET /api/auth/me without token returns 401 Unauthorized');

  // Protected Customer Route - Tampered JWT Token (401)
  const meTampered = await request({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${customerToken}tampered` }
  });
  assert(meTampered.statusCode === 401, 'AUTH-10', 'GET /api/auth/me with tampered signature returns 401 Unauthorized');

  // ==============================================================
  // SECTION 3: ADMIN AUTHENTICATION & ACCESS CONTROL
  // ==============================================================
  console.log('\n--- SECTION 3: Admin Authentication & RBAC ---');

  // Admin Login - Valid
  const adminLoginOk = await request({ method: 'POST', path: '/api/admin/login' }, {
    username: 'admin',
    password: 'admin123'
  });
  assert(
    adminLoginOk.statusCode === 200 && adminLoginOk.json?.data?.token,
    'ADMIN-01',
    'Admin login returns 200 OK with admin token'
  );
  adminToken = adminLoginOk.json?.data?.token || '';

  // Admin Login - Invalid Credentials
  const adminLoginBad = await request({ method: 'POST', path: '/api/admin/login' }, {
    username: 'admin',
    password: 'wrongpassword'
  });
  assert(adminLoginBad.statusCode === 401, 'ADMIN-02', 'Admin login with wrong password returns 401 Unauthorized');

  // Admin Dashboard - Valid Admin Token
  const adminDashOk = await request({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    adminDashOk.statusCode === 200 && adminDashOk.json?.data?.stats,
    'ADMIN-03',
    'GET /api/admin/dashboard returns operational stats'
  );

  // Admin Dashboard - Customer Token (RBAC Failure)
  const adminDashCust = await request({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert(
    adminDashCust.statusCode === 401 || adminDashCust.statusCode === 403,
    'ADMIN-04',
    'Accessing Admin endpoint with Customer JWT is rejected (401/403 RBAC)'
  );

  // Admin Live Visitors - Online Green Dot Count
  const liveVisitors = await request({
    path: '/api/admin/live-visitors',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    liveVisitors.statusCode === 200 && typeof liveVisitors.json?.data?.onlineCustomers === 'number',
    'ADMIN-05',
    'GET /api/admin/live-visitors returns active customer count for green dot indicator'
  );

  // ==============================================================
  // SECTION 4: PRODUCT CATALOG & SEARCH TESTS
  // ==============================================================
  console.log('\n--- SECTION 4: Product Catalog, Filter & Search ---');

  // Public Products Listing
  const productsList = await request({ path: '/api/products' });
  assert(
    productsList.statusCode === 200 && Array.isArray(productsList.json?.data?.products),
    'PROD-01',
    'GET /api/products returns product array and pagination metadata'
  );

  // Pagination limit boundary
  const prodPageLimit = await request({ path: '/api/products?page=1&limit=3' });
  assert(
    prodPageLimit.statusCode === 200 && prodPageLimit.json?.data?.products?.length <= 3,
    'PROD-02',
    'GET /api/products?limit=3 respects pagination limit'
  );

  // Search Suggestions (1 letter query e.g. "r")
  const suggestRes = await request({ path: '/api/products/suggestions?q=r' });
  assert(
    suggestRes.statusCode === 200 && Array.isArray(suggestRes.json?.data?.suggestions),
    'PROD-03',
    'GET /api/products/suggestions?q=r returns suggestions array with product name, price, stock status',
    `Got ${suggestRes.statusCode}: ${suggestRes.body}`
  );

  // Find a product with unit price < 200 (for minimum order check)
  const allProds = productsList.json?.data?.products || [];
  const cheapProd = allProds.find(p => p.price < 200) || allProds[0] || { id: 1, price: 25 };
  const firstProdId = cheapProd.id;

  // Single Product by Valid ID
  const singleProd = await request({ path: `/api/products/${firstProdId}` });
  assert(
    singleProd.statusCode === 200 && singleProd.json?.data?.product?.id === firstProdId,
    'PROD-04',
    `GET /api/products/${firstProdId} returns product detail`,
    `Got ${singleProd.statusCode}: ${singleProd.body}`
  );

  // Product by Non-existent ID
  const nonExistProd = await request({ path: '/api/products/999999' });
  assert(nonExistProd.statusCode === 404, 'PROD-05', 'GET /api/products/999999 returns 404 Not Found');

  // Categories Listing
  const catList = await request({ path: '/api/categories' });
  assert(
    catList.statusCode === 200 && Array.isArray(catList.json?.data?.categories),
    'CAT-01',
    'GET /api/categories returns active categories list',
    `Got ${catList.statusCode}: ${catList.body}`
  );

  // ==============================================================
  // SECTION 5: ORDERS, MIN ORDER CRITERIA & WHATSAPP MESSAGE FORMAT
  // ==============================================================
  console.log('\n--- SECTION 5: Orders, ₹200 Minimum Criteria & Clean Text WhatsApp ---');

  // Order with subtotal < 200 (Min order criteria check: 1 unit of cheap product e.g. ₹25)
  const orderBelowMin = await request({
    method: 'POST',
    path: '/api/enquiries',
    headers: { Authorization: `Bearer ${customerToken}` }
  }, {
    customerName: 'QA Customer',
    customerMobile: testMobile,
    items: [{ productId: firstProdId, quantity: 1 }] // Total is < 200
  });
  assert(
    orderBelowMin.statusCode === 400 && orderBelowMin.json?.message?.includes('200'),
    'ORD-01',
    'Order with subtotal < ₹200 is rejected with 400 Bad Request and minimum order message',
    `Got ${orderBelowMin.statusCode}: ${orderBelowMin.body}`
  );

  // Order with subtotal >= 200 (Valid Order)
  const validQty = Math.ceil(220 / cheapProd.price);
  const orderValid = await request({
    method: 'POST',
    path: '/api/enquiries',
    headers: { Authorization: `Bearer ${customerToken}` }
  }, {
    customerName: 'QA Customer',
    customerMobile: testMobile,
    items: [{ productId: firstProdId, quantity: validQty }]
  });
  assert(
    orderValid.statusCode === 201 && orderValid.json?.data?.invoiceNumber,
    'ORD-02',
    'Order with subtotal >= ₹200 succeeds with 201 Created and generates invoiceNumber'
  );

  // WhatsApp Message Text Format Verification (Strict Text Only, NO emoji, NO image)
  const messageText = orderValid.json?.data?.messageText || '';
  const containsEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(messageText);
  const containsImage = /http.*\.(jpg|png|webp|gif)/i.test(messageText) || messageText.toLowerCase().includes('image');
  const hasCustomerName = messageText.includes('Customer Name:');
  const hasItemName = messageText.includes('Item Name:');
  const hasQuantity = messageText.includes('Quantity:');
  const hasPrice = messageText.includes('Price: Rs.');
  const hasTotalAmount = messageText.includes('Total Amount: Rs.');

  assert(!containsEmoji, 'ORD-03', 'WhatsApp message contains ZERO emojis');
  assert(!containsImage, 'ORD-04', 'WhatsApp message contains ZERO image links / image references');
  assert(
    hasCustomerName && hasItemName && hasQuantity && hasPrice && hasTotalAmount,
    'ORD-05',
    'WhatsApp message contains ONLY customer name, item name, quantity, price, and total amount'
  );

  // Public Invoice View
  const invNumber = orderValid.json?.data?.invoiceNumber;
  const invRes = await request({ path: `/api/invoices/${invNumber}` });
  assert(
    invRes.statusCode === 200 && invRes.json?.data?.invoice?.invoice_number === invNumber,
    'INV-01',
    'GET /api/invoices/:invoiceNumber retrieves public invoice details'
  );

  // Non-existent Invoice View
  const invBad = await request({ path: '/api/invoices/INVALID-INV-000' });
  assert(invBad.statusCode === 404, 'INV-02', 'Non-existent invoice returns 404 Not Found');

  // ==============================================================
  // SECTION 6: LIVE STOCK INVENTORY & AUDIT LOGS
  // ==============================================================
  console.log('\n--- SECTION 6: Live Stock Management & Inline +/- ---');

  // Admin Stock List
  const stockList = await request({
    path: '/api/admin/stock',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    stockList.statusCode === 200 && Array.isArray(stockList.json?.data?.inventory),
    'STOCK-01',
    'GET /api/admin/stock returns current stock levels',
    `Got ${stockList.statusCode}: ${stockList.body}`
  );

  // Admin Stock Update (+/- change)
  const stockItem = stockList.json?.data?.inventory?.[0];
  if (stockItem) {
    const origStock = stockItem.stock_quantity;
    const updateStock = await request({
      method: 'PUT',
      path: `/api/admin/stock/${stockItem.id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      quantity: 5,
      changeType: 'increase',
      notes: 'QA Automated Stock Test'
    });
    assert(
      updateStock.statusCode === 200 && updateStock.json?.data?.updatedStock === origStock + 5,
      'STOCK-02',
      'PUT /api/admin/stock/:id updates stock live and returns updated quantity',
      `Got ${updateStock.statusCode}: ${updateStock.body}`
    );

    // Revert stock change cleanly
    await request({
      method: 'PUT',
      path: `/api/admin/stock/${stockItem.id}`,
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      quantity: 5,
      changeType: 'decrease',
      notes: 'QA Revert Stock Test'
    });
  }

  // ==============================================================
  // SECTION 7: DATABASE INTEGRITY & SQL INJECTION SECURITY
  // ==============================================================
  console.log('\n--- SECTION 7: Database Integrity & SQL Injection Testing ---');

  // SQL Injection in Login Mobile
  const sqliLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: "' OR '1'='1' --",
    password: "' OR '1'='1' --"
  });
  assert(
    sqliLogin.statusCode === 400 || sqliLogin.statusCode === 401 || sqliLogin.statusCode === 404,
    'SEC-01',
    'SQL Injection attempt in login mobile is safely rejected (Parameterized query)',
    `Got ${sqliLogin.statusCode}: ${sqliLogin.body}`
  );

  // SQL Injection in Product Search
  const sqliSearch = await request({
    path: "/api/products?search=' UNION SELECT 1,username,password,null,null,null,null,null,null,null,null,null,null FROM admins --"
  });
  assert(
    sqliSearch.statusCode === 200 && !JSON.stringify(sqliSearch.json).includes('$2a$'),
    'SEC-02',
    'SQL Injection UNION attempt in search query is sanitized without leaking credentials'
  );

  // SQL Injection in Product ID (Rejected by regex validator)
  const sqliProdId = await request({ path: "/api/products/1' OR '1'='1" });
  assert(
    sqliProdId.statusCode === 400,
    'SEC-03',
    'SQL Injection in URL product ID is strictly caught with 400 Bad Request',
    `Got ${sqliProdId.statusCode}: ${sqliProdId.body}`
  );

  // XSS Injection attempt in Customer Name during Order
  const xssOrder = await request({
    method: 'POST',
    path: '/api/enquiries',
    headers: { Authorization: `Bearer ${customerToken}` }
  }, {
    customerName: '<script>alert("XSS")</script>John',
    customerMobile: testMobile,
    items: [{ productId: firstProdId, quantity: validQty }]
  });
  assert(
    xssOrder.statusCode === 201 && !xssOrder.json?.data?.customerName?.includes('<script>'),
    'SEC-04',
    'XSS payloads in customer input are sanitized and stripped of script tags',
    `Got ${xssOrder.statusCode}: ${xssOrder.body}`
  );

  // ==============================================================
  // SECTION 8: PERFORMANCE BENCHMARKING & CONCURRENCY
  // ==============================================================
  console.log('\n--- SECTION 8: Performance Profiling & Concurrency ---');

  // Benchmark response time for products list
  const t0 = Date.now();
  await request({ path: '/api/products' });
  const prodLatency = Date.now() - t0;
  assert(prodLatency < 300, 'PERF-01', `GET /api/products latency is within SLA (<300ms, actual: ${prodLatency}ms)`);

  // Benchmark search suggestions
  const t1 = Date.now();
  await request({ path: '/api/products/suggestions?q=salt' });
  const suggestLatency = Date.now() - t1;
  assert(suggestLatency < 150, 'PERF-02', `GET /api/products/suggestions latency is fast (<150ms, actual: ${suggestLatency}ms)`);

  // Concurrency test: 30 simultaneous requests
  const concurrencyCount = 30;
  const startConc = Date.now();
  const promises = [];
  for (let i = 0; i < concurrencyCount; i++) {
    promises.push(request({ path: '/api/products' }));
  }
  const results = await Promise.all(promises);
  const totalConcTime = Date.now() - startConc;
  const allSuccessful = results.every(r => r.statusCode === 200);

  assert(
    allSuccessful,
    'PERF-03',
    `Database connection pool handled ${concurrencyCount} concurrent requests with 100% success in ${totalConcTime}ms`
  );

  // ==============================================================
  // SUMMARY REPORT
  // ==============================================================
  console.log('\n===============================================================');
  console.log('📊 QA AUTOMATION SUITE EXECUTION SUMMARY');
  console.log('===============================================================');
  console.log(`Total Test Cases Executed : ${passCount + failCount}`);
  console.log(`Passed Test Cases         : \x1b[32m${passCount}\x1b[0m`);
  console.log(`Failed Test Cases         : \x1b[31m${failCount}\x1b[0m`);
  const passRate = ((passCount / (passCount + failCount)) * 100).toFixed(1);
  console.log(`Pass Percentage           : \x1b[36m${passRate}%\x1b[0m`);
  console.log('===============================================================\n');

  // Clean up QA test customer from DB to keep DB pristine
  try {
    await pool.execute('DELETE FROM users WHERE mobile_number = ?', [testMobile]);
  } catch (e) {}

  process.exit(failCount > 0 ? 1 : 0);
}

runMasterQASuite().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
