/**
 * COMPLETE SYSTEM TESTING & AUTOMATION TEST SUITE - ROJA TRADERS
 * Covers all 15 Testing Modules:
 * MODULE 01: Frontend / UI & Static Asset Testing
 * MODULE 02: Functional User Journey & Admin Operations Testing
 * MODULE 03: API Endpoints, Status Codes & Boundaries Testing
 * MODULE 04: Database Schema Integrity & Constraints Testing
 * MODULE 05: Security, JWT, RBAC & Vulnerability Testing
 * MODULE 06: Performance Profiling, Latency & Concurrency Stress Testing
 * MODULE 07: Mobile Responsiveness, Viewport & PWA Architecture Testing
 * MODULE 08: WhatsApp Clean-Text Order Dispatch Testing
 * MODULE 09: Invoice, Visual Bill & Payment QR Testing
 * MODULE 10: Error Handling, Resilience & 404 Recovery Testing
 * MODULE 11: Cross-Viewport & Layout Compatibility Testing
 * MODULE 12: Usability, Accessibility & Notification Testing
 * MODULE 13: Data Cleanup & Admin Management Testing
 * MODULE 14: Deployment, SPA Routing & Production Build Testing
 * MODULE 15: Defect Identification & Verification Testing
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const jwt = require(path.join(__dirname, '..', 'server', 'node_modules', 'jsonwebtoken'));
const pool = require(path.join(__dirname, '..', 'server', 'config', 'db'));

const BASE_URL = 'http://localhost:5000';
const CLIENT_URL = 'http://localhost:5173';

const results = [];
let passCount = 0;
let failCount = 0;

function assert(condition, testId, moduleName, description, details = '') {
  if (condition) {
    passCount++;
    results.push({ id: testId, module: moduleName, status: 'PASS', description, details });
    console.log(`  \x1b[32m✔ PASS\x1b[0m [${testId}] [${moduleName}] ${description}`);
  } else {
    failCount++;
    results.push({ id: testId, module: moduleName, status: 'FAIL', description, details });
    console.log(`  \x1b[31m✖ FAIL\x1b[0m [${testId}] [${moduleName}] ${description}`);
    if (details) console.log(`         \x1b[33mDetails: ${typeof details === 'object' ? JSON.stringify(details) : details}\x1b[0m`);
  }
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = options.url || (BASE_URL + options.path);
    const url = new URL(fullUrl);
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

async function runCompleteTestSuite() {
  console.log('\n===============================================================');
  console.log('🚀 EXECUTING COMPLETE SYSTEM TESTING & AUTOMATION MASTER SUITE');
  console.log('===============================================================\n');

  let customerToken = '';
  let adminToken = '';
  const testMobile = '98765' + Math.floor(10000 + Math.random() * 90000);
  const testPassword = 'TestPass@2026';
  let createdProductId = null;
  let createdEnquiryId = null;
  let testInvoiceNumber = '';

  // -------------------------------------------------------------
  // MODULE 01: FRONTEND / UI & STATIC ASSET TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 01: Frontend / UI & Static Asset Testing ---');
  
  // Test Client Entrypoint (Vite or static server)
  try {
    const clientRes = await request({ url: CLIENT_URL });
    assert(clientRes.statusCode === 200 && clientRes.body.includes('<div id="root">'), 'UI-01', 'MOD-01', 'Frontend client loads successfully with root mount point');
  } catch (e) {
    // Fallback: test dist/index.html
    const hasDist = fs.existsSync(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
    assert(hasDist, 'UI-01', 'MOD-01', 'Frontend static dist/index.html is compiled and available');
  }

  // App Manifest Existence
  const manifestPath = path.join(__dirname, '..', 'client', 'public', 'manifest.webmanifest');
  const hasManifest = fs.existsSync(manifestPath);
  let manifestJson = {};
  if (hasManifest) {
    manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  assert(
    hasManifest && manifestJson.display === 'standalone' && manifestJson.icons?.length >= 2,
    'UI-02',
    'MOD-01',
    'PWA Web App Manifest is valid with standalone mode and high-res icons'
  );

  // Service Worker File Existence
  const swPath = path.join(__dirname, '..', 'client', 'public', 'sw.js');
  const hasSw = fs.existsSync(swPath);
  assert(hasSw, 'UI-03', 'MOD-01', 'Service worker script (sw.js) exists for offline support and asset caching');

  // Direct APK Download Endpoint
  const apkRes = await request({ path: '/download/app' });
  assert(apkRes.statusCode === 200 && apkRes.headers['content-type']?.includes('android.package-archive'), 'UI-04', 'MOD-01', 'Direct APK package download endpoint functions with correct MIME type');

  // -------------------------------------------------------------
  // MODULE 02: FUNCTIONAL TESTING (AUTH, CRUD, SEARCH & FILTER)
  // -------------------------------------------------------------
  console.log('\n--- MODULE 02: Functional Testing (User & Admin Operations) ---');

  // Customer Registration
  const regRes = await request({ method: 'POST', path: '/api/auth/register' }, {
    name: 'Sudhasun QA Tester',
    mobileNumber: testMobile,
    password: testPassword
  });
  assert(regRes.statusCode === 201 && regRes.json?.data?.token, 'FUNC-01', 'MOD-02', 'Customer account registration creates user and returns JWT token');
  customerToken = regRes.json?.data?.token || '';

  // Duplicate Mobile Registration Rejection
  const dupReg = await request({ method: 'POST', path: '/api/auth/register' }, {
    name: 'Duplicate Tester',
    mobileNumber: testMobile,
    password: testPassword
  });
  assert(dupReg.statusCode === 409, 'FUNC-02', 'MOD-02', 'Duplicate mobile registration is rejected with 409 Conflict');

  // Customer Login
  const loginRes = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: testMobile,
    password: testPassword
  });
  assert(loginRes.statusCode === 200 && loginRes.json?.data?.token, 'FUNC-03', 'MOD-02', 'Customer login succeeds with 200 OK and valid session token');

  // Admin Login via username or mobile
  const adminLogin = await request({ method: 'POST', path: '/api/admin/login' }, {
    username: 'admin',
    password: 'admin123'
  });
  assert(adminLogin.statusCode === 200 && adminLogin.json?.data?.token, 'FUNC-04', 'MOD-02', 'Admin authentication succeeds and returns admin session token');
  adminToken = adminLogin.json?.data?.token || '';

  // Admin Profile Retrieval & Update
  const getProfile = await request({
    path: '/api/admin/profile',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(getProfile.statusCode === 200 && getProfile.json?.data?.admin?.id, 'FUNC-05', 'MOD-02', 'Admin profile retrieval returns admin record');

  // Product Autocomplete Search
  const searchRes = await request({ path: '/api/products/suggestions?q=salt' });
  assert(searchRes.statusCode === 200 && Array.isArray(searchRes.json?.data?.suggestions), 'FUNC-06', 'MOD-02', 'Product autocomplete search returns suggestions array');

  // Product Catalog Filtering by Category
  const catRes = await request({ path: '/api/categories' });
  const firstCatId = catRes.json?.data?.categories?.[0]?.id;
  const filterRes = await request({ path: `/api/products?category_id=${firstCatId || 1}` });
  assert(filterRes.statusCode === 200 && Array.isArray(filterRes.json?.data?.products), 'FUNC-07', 'MOD-02', 'Product catalog category filtering returns matching items');

  // -------------------------------------------------------------
  // MODULE 03: API TESTING & BOUNDARY VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- MODULE 03: API Testing & Boundary Validation ---');

  // Boundary: Missing registration fields
  const emptyReg = await request({ method: 'POST', path: '/api/auth/register' }, {});
  assert(emptyReg.statusCode === 400, 'API-01', 'MOD-03', 'Registration with empty body returns 400 Bad Request');

  // Boundary: Password minimum length validation (<8 chars)
  const weakPassReg = await request({ method: 'POST', path: '/api/auth/register' }, {
    name: 'Weak Pass',
    mobileNumber: '9123456789',
    password: '123'
  });
  assert(weakPassReg.statusCode === 400, 'API-02', 'MOD-03', 'Registration with password < 8 characters is rejected with 400');

  // Boundary: Invalid product ID (999999)
  const nonExistentProd = await request({ path: '/api/products/999999' });
  assert(nonExistentProd.statusCode === 404, 'API-03', 'MOD-03', 'GET non-existent product ID returns 404 Not Found');

  // Boundary: Pagination Limit
  const paginatedProd = await request({ path: '/api/products?page=1&limit=4' });
  assert(
    paginatedProd.statusCode === 200 && paginatedProd.json?.data?.products?.length <= 4,
    'API-04',
    'MOD-03',
    'Pagination limit query parameter is respected'
  );

  // -------------------------------------------------------------
  // MODULE 04: DATABASE TESTING (INTEGRITY & TRANSACTIONS)
  // -------------------------------------------------------------
  console.log('\n--- MODULE 04: Database Testing (Schema & Integrity) ---');

  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const expectedTables = ['users', 'admins', 'categories', 'products', 'product_images', 'enquiries', 'enquiry_items', 'website_settings'];
    const allPresent = expectedTables.every(t => tableNames.includes(t));
    assert(allPresent, 'DB-01', 'MOD-04', `All core schema tables exist in database (${expectedTables.length} tables verified)`);

    // Verify User Role column
    const [userRoleCol] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'");
    assert(userRoleCol.length > 0, 'DB-02', 'MOD-04', "Schema integrity: 'role' column exists in 'users' table");

    // Verify Admin Mobile Number column
    const [adminMobileCol] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'mobile_number'");
    assert(adminMobileCol.length > 0, 'DB-03', 'MOD-04', "Schema integrity: 'mobile_number' column exists in 'admins' table");
  } catch (dbErr) {
    assert(false, 'DB-01', 'MOD-04', 'Database query check failed', dbErr.message);
  }

  // -------------------------------------------------------------
  // MODULE 05: SECURITY, RBAC & VULNERABILITY TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 05: Security, RBAC & Vulnerability Testing ---');

  // SQL Injection in Mobile Login Field
  const sqliLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    mobileNumber: "' OR '1'='1' --",
    password: "any"
  });
  assert(sqliLogin.statusCode === 400 || sqliLogin.statusCode === 401 || sqliLogin.statusCode === 404, 'SEC-01', 'MOD-05', 'SQL injection attack in login field is safely neutralized');

  // SQL Injection in Search Query
  const sqliSearch = await request({ path: "/api/products/suggestions?q=' UNION SELECT 1,username,password,4,5,6 FROM admins--" });
  assert(
    sqliSearch.statusCode === 200 && !JSON.stringify(sqliSearch.json).includes('$2a$10$'),
    'SEC-02',
    'MOD-05',
    'SQL injection UNION attack in search is safely parameterized without data leakage'
  );

  // RBAC Access Control: Customer JWT blocked from Admin endpoint
  const rbacBlocked = await request({
    path: '/api/admin/dashboard',
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert(rbacBlocked.statusCode === 401 || rbacBlocked.statusCode === 403, 'SEC-03', 'MOD-05', 'RBAC Enforcement: Customer token is forbidden from accessing Admin Dashboard');

  // Tampered JWT Token
  const tamperedTokenRes = await request({
    path: '/api/auth/me',
    headers: { Authorization: `Bearer ${customerToken}TAMPERED` }
  });
  assert(tamperedTokenRes.statusCode === 401, 'SEC-04', 'MOD-05', 'Tampered JWT signature is rejected with 401 Unauthorized');

  // -------------------------------------------------------------
  // MODULE 06: PERFORMANCE & CONCURRENCY LOAD TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 06: Performance & Concurrency Load Testing ---');

  const startSingle = Date.now();
  const perfRes = await request({ path: '/api/products' });
  const latencySingle = Date.now() - startSingle;
  assert(perfRes.statusCode === 200 && latencySingle < 300, 'PERF-01', 'MOD-06', `Product catalog latency within SLA (<300ms, actual: ${latencySingle}ms)`);

  // Concurrent Burst Testing (30 parallel requests)
  const startBurst = Date.now();
  const burstRequests = Array.from({ length: 30 }, () => request({ path: '/api/products/suggestions?q=salt' }));
  const burstResults = await Promise.all(burstRequests);
  const burstTime = Date.now() - startBurst;
  const allBurst200 = burstResults.every(r => r.statusCode === 200);
  assert(allBurst200 && burstTime < 2500, 'PERF-02', 'MOD-06', `Connection pool handled 30 concurrent queries successfully in ${burstTime}ms`);

  // -------------------------------------------------------------
  // MODULE 07: MOBILE & PWA ARCHITECTURE TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 07: Mobile Responsiveness & PWA Testing ---');

  // Check index.html for viewport and theme-color
  const indexPath = path.join(__dirname, '..', 'client', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert(
    indexHtml.includes('name="viewport"') && indexHtml.includes('width=device-width'),
    'MOB-01',
    'MOD-07',
    'HTML entrypoint includes responsive mobile viewport meta tags'
  );
  assert(
    indexHtml.includes('manifest.webmanifest'),
    'MOB-02',
    'MOD-07',
    'HTML entrypoint links correctly to web application manifest'
  );

  // Check CustomerLayout for horizontal overflow protection
  const layoutPath = path.join(__dirname, '..', 'client', 'src', 'layouts', 'CustomerLayout.jsx');
  const layoutCode = fs.readFileSync(layoutPath, 'utf8');
  assert(
    layoutCode.includes('overflow-x-hidden'),
    'MOB-03',
    'MOD-07',
    'Customer layout enforces horizontal overflow containment (overflow-x-hidden)'
  );

  // Check Floating WhatsApp positioning (bottom-20 on mobile)
  const waPath = path.join(__dirname, '..', 'client', 'src', 'components', 'FloatingWhatsApp.jsx');
  const waCode = fs.readFileSync(waPath, 'utf8');
  assert(
    waCode.includes('bottom-20') && waCode.includes('z-50'),
    'MOB-04',
    'MOD-07',
    'Floating WhatsApp icon is positioned above mobile bottom navigation bar (bottom-20, z-50)'
  );

  // -------------------------------------------------------------
  // MODULE 08: WHATSAPP CLEAN-TEXT ORDER TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 08: WhatsApp Order Formatting & Dispatch Testing ---');

  // Minimum Order Threshold: Under ₹200 should be rejected
  const lowOrderRes = await request({ method: 'POST', path: '/api/enquiries' }, {
    customer_name: 'Test Customer',
    customer_mobile: '9876543210',
    items: [{ product_id: 1, quantity: 1, effective_price: 50 }]
  });
  assert(lowOrderRes.statusCode === 400, 'WA-01', 'MOD-08', 'Order with subtotal < ₹200 is rejected with 400 Bad Request');

  // Valid Order: Subtotal >= ₹200
  const validOrderRes = await request({ method: 'POST', path: '/api/enquiries' }, {
    customerName: 'Sudhasun Customer',
    customerMobile: '9597993402',
    items: [
      { productId: 48, quantity: 1 }
    ]
  });
  assert(
    validOrderRes.statusCode === 201 && validOrderRes.json?.data?.invoiceNumber,
    'WA-02',
    'MOD-08',
    'Order >= ₹200 succeeds with 201 Created and generates formal invoice number'
  );
  createdEnquiryId = validOrderRes.json?.data?.enquiryId;
  testInvoiceNumber = validOrderRes.json?.data?.invoiceNumber;

  const whatsappMessage = validOrderRes.json?.data?.whatsappMessage || '';
  const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(whatsappMessage);
  const hasImageRef = /https?:\/\/.*?\.(png|jpg|jpeg|gif|webp)/i.test(whatsappMessage) || /\[image/i.test(whatsappMessage);
  assert(!hasEmoji, 'WA-03', 'MOD-08', 'WhatsApp dispatch text adheres strictly to clean text policy (ZERO emojis)');
  assert(!hasImageRef, 'WA-04', 'MOD-08', 'WhatsApp dispatch text contains ZERO external image links or file attachments');

  // -------------------------------------------------------------
  // MODULE 09: INVOICE, DIGITAL BILL & PAYMENT QR TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 09: Invoice, Digital Bill & Payment QR Testing ---');

  if (testInvoiceNumber) {
    const invRes = await request({ path: `/api/invoices/${testInvoiceNumber}` });
    assert(
      invRes.statusCode === 200 && invRes.json?.data?.invoice?.invoice_number === testInvoiceNumber,
      'INV-01',
      'MOD-09',
      'Public invoice retrieval endpoint returns customer bill details'
    );

    // Visual SVG Bill Image Endpoint
    const imgRes = await request({ path: `/api/invoices/${testInvoiceNumber}/image` });
    assert(
      imgRes.statusCode === 200 && imgRes.headers['content-type']?.includes('image/svg+xml'),
      'INV-02',
      'MOD-09',
      'Visual SVG Bill image generation endpoint returns 200 OK with image/svg+xml MIME type'
    );
  }

  // Invoice Settings in Admin (Editable QR Code)
  const invSettingsRes = await request({
    path: '/api/admin/invoice-settings',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    invSettingsRes.statusCode === 200 && invSettingsRes.json?.data?.settings?.company_name,
    'INV-03',
    'MOD-09',
    'Admin invoice configuration endpoint returns store settings with editable payment QR support'
  );

  // -------------------------------------------------------------
  // MODULE 10: ERROR HANDLING & RESILIENCE TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 10: Error Handling & Resilience Testing ---');

  // Undefined API Route (404)
  const notFoundRes = await request({ path: '/api/undefined-endpoint-for-testing' });
  assert(notFoundRes.statusCode === 404, 'ERR-01', 'MOD-10', 'Undefined API route is caught cleanly by 404 handler');

  // Malformed JSON Payload
  const malformedRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 14
      }
    }, res => {
      resolve({ statusCode: res.statusCode });
    });
    req.write('{"malformed": ');
    req.end();
  });
  assert(malformedRes.statusCode === 400, 'ERR-02', 'MOD-10', 'Malformed JSON payload is handled cleanly without server crash (400 Bad Request)');

  // -------------------------------------------------------------
  // MODULE 11: CROSS-VIEWPORT & LAYOUT COMPATIBILITY TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 11: Cross-Viewport & Layout Compatibility Testing ---');

  // Verify Navbar responsive classes (Tailwind sm: md: lg:)
  const navbarPath = path.join(__dirname, '..', 'client', 'src', 'components', 'Navbar.jsx');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');
  assert(
    navbarCode.includes('sm:') && navbarCode.includes('md:') && navbarCode.includes('lg:'),
    'VIEW-01',
    'MOD-11',
    'Top navigation bar uses responsive breakpoint layouts for mobile, tablet, and desktop'
  );

  // Verify Our Products heading replaced Handpicked Collection
  const homePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'HomePage.jsx');
  const homeCode = fs.readFileSync(homePath, 'utf8');
  assert(
    homeCode.includes('Our Products') && !homeCode.includes('Featured Essentials'),
    'VIEW-02',
    'MOD-11',
    "Storefront correctly displays 'Our Products' section heading without legacy titles"
  );

  // -------------------------------------------------------------
  // MODULE 12: USABILITY, ACCESSIBILITY & NOTIFICATION TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 12: Usability & Notification Testing ---');

  // Delivery Location Exclusivity Notice Verification
  assert(
    navbarCode.includes('Tiruppur & Avinashi') && homeCode.includes('Tiruppur & Avinashi'),
    'USAB-01',
    'MOD-12',
    'Customer viewpoint clearly surfaces delivery exclusivity notice for Tiruppur & Avinashi'
  );

  // MapPin Vector Icon Usage instead of Emojis
  assert(
    navbarCode.includes('<MapPin') && homeCode.includes('<MapPin'),
    'USAB-02',
    'MOD-12',
    'Vector MapPin SVG icons are used instead of legacy emojis across storefront'
  );

  // -------------------------------------------------------------
  // MODULE 13: ADMIN MANAGEMENT & DATA CLEANUP TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 13: Admin Management & Data Cleanup Testing ---');

  // Admin Live Visitors Indicator
  const visitorsRes = await request({
    path: '/api/admin/live-visitors',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    visitorsRes.statusCode === 200 && typeof (visitorsRes.json?.data?.onlineCustomers ?? visitorsRes.json?.data?.onlineVisitors) === 'number',
    'ADM-01',
    'MOD-13',
    'Admin real-time visitor tracking returns active visitor count for pulse indicator'
  );

  // Admin Stock Management
  const stockRes = await request({
    path: '/api/admin/stock',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    stockRes.statusCode === 200 && Array.isArray(stockRes.json?.data?.inventory || stockRes.json?.data?.stockList),
    'ADM-02',
    'MOD-13',
    'Admin stock audit returns live product stock inventory list'
  );

  // Order Status Update Transition
  if (createdEnquiryId) {
    const updateStatus = await request({
      method: 'PUT',
      path: `/api/admin/enquiries/${createdEnquiryId}/status`,
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      enquiry_status: 'contacted',
      notes: 'Customer contacted via WhatsApp'
    });
    assert(
      updateStatus.statusCode === 200 && updateStatus.json?.data?.enquiry_status === 'contacted',
      'ADM-03',
      'MOD-13',
      "Admin order status transition ('pending' -> 'contacted') updates successfully"
    );
  }

  // -------------------------------------------------------------
  // MODULE 14: DEPLOYMENT & PRODUCTION BUILD TESTING
  // -------------------------------------------------------------
  console.log('\n--- MODULE 14: Deployment & Production Build Testing ---');

  const distExists = fs.existsSync(path.join(__dirname, '..', 'client', 'dist'));
  const htmlExists = fs.existsSync(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  const redirectsExists = fs.existsSync(path.join(__dirname, '..', 'client', 'public', '_redirects')) || fs.existsSync(path.join(__dirname, '..', '_redirects'));
  assert(distExists && htmlExists, 'DEP-01', 'MOD-14', 'Production static build directory (client/dist) is compiled and ready for static hosting');
  assert(redirectsExists, 'DEP-02', 'MOD-14', 'SPA rewrite redirect rule (_redirects) exists for 200 status routing');

  // -------------------------------------------------------------
  // MODULE 15: DEFECT IDENTIFICATION & FIX VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- MODULE 15: Defect Identification & Fix Verification ---');

  // Verify that 'Live Status' text badge is removed from MyOrdersPage.jsx
  const ordersPagePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'MyOrdersPage.jsx');
  const ordersPageCode = fs.readFileSync(ordersPagePath, 'utf8');
  assert(
    !ordersPageCode.includes('Live Status</span>'),
    'DEF-01',
    'MOD-15',
    "Defect Fix: 'Live Status' text badge is verified removed from order history header"
  );
  assert(
    !ordersPageCode.includes('Real-time Status Sync</span>'),
    'DEF-02',
    'MOD-15',
    "Defect Fix: 'Real-time Status Sync' text is verified removed while status dot is retained"
  );

  // =============================================================
  // SUMMARY REPORT
  // =============================================================
  console.log('\n===============================================================');
  console.log('📊 COMPLETE SYSTEM TEST EXECUTION SUMMARY ACROSS 15 MODULES');
  console.log('===============================================================');
  console.log(`Total Test Cases Executed : ${passCount + failCount}`);
  console.log(`Passed Test Cases         : ${passCount}`);
  console.log(`Failed Test Cases         : ${failCount}`);
  console.log(`Pass Percentage           : ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  console.log('===============================================================\n');

  // Exit with status code
  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCompleteTestSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
