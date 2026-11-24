# Comprehensive Project Architecture & Technical Analysis Report
**Project Name:** Roja Traders WhatsApp-Based E-Commerce Showcase & Management Platform  
**Analysis Date:** November 24, 2026  
**Environment:** Production / Staging / Local Hybrid  
**Status:** Live & Production Ready  

---

## 1. Executive Summary

Roja Traders is a full-stack, mobile-first, Progressive Web App (PWA) e-commerce platform integrated with direct WhatsApp order dispatch, real-time live stock management, digital invoice bill generation, customer authentication, and an administrative console.

The application bridges digital catalog browsing with traditional merchant-customer WhatsApp communication, avoiding high transaction gateway fees while enforcing order validation rules (e.g., minimum order criteria of ₹200).

---

## 2. Technology Stack & Framework Identification

### 2.1 Frontend Architecture
- **Framework:** React 18.3.1 (Single Page Application - SPA)
- **Bundler & Build Tool:** Vite 6.1.0 (configured with `@vitejs/plugin-react` and `@rollup/wasm-node`)
- **Routing:** React Router v7 (`react-router-dom` 7.1.5)
- **Styling & Design System:**
  - Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
  - Tailwind Plugins & Utilities (`clsx`, `tailwind-merge`)
  - Icons: `lucide-react` 0.475.0 (vector SVG icons throughout)
  - Color Palette: Deep Emerald (`#065f46`, `#047857`), Teal, WhatsApp Green (`#25D366`), Slate Neutrals
- **PWA Capabilities:**
  - Web App Manifest (`manifest.webmanifest`) with standalone display mode, maskable icons, shortcuts
  - Custom Service Worker (`sw.js`) with cache-first static assets, network-first dynamic APIs, and offline fallback
  - In-browser 1-click native install handler (`beforeinstallprompt`)
- **Key Client Dependencies:**
  - `axios` (1.7.9): HTTP client for REST API communication
  - `html-to-image` (1.11.13): Client-side SVG/HTML bill-to-image and bill-to-blob generation for direct WhatsApp sharing

### 2.2 Backend Architecture
- **Runtime Environment:** Node.js (v24.x)
- **Web Framework:** Express.js 4.21.2
- **Architecture Pattern:** Modular MVC (Model-View-Controller) / Route-Controller-Service pattern
- **Key Server Middleware:**
  - `helmet` (8.0.0): Security headers with configured Content Security Policy (CSP)
  - `cors` (2.8.5): Dynamic cross-origin resource sharing with origin whitelisting
  - `express-rate-limit` (7.5.0): Multi-tiered rate limiting (general API rate limit + strict admin API limiter)
  - `morgan` (1.10.0): HTTP request logger (disabled during test runs)
  - `multer` (1.4.5-lts.1): Multi-part file upload processing with MIME-type and size validation
  - Custom `errorHandler`: Centralized error normalization and JSON response formatting
  - Custom `visitorTracker`: Real-time active customer heartbeat tracking for admin live indicator

### 2.3 Database Architecture & Configuration
- **Database Engine:** MySQL 8.0+ / TiDB Cloud Serverless (Distributed MySQL-compatible engine)
- **Driver:** `mysql2` (3.12.0) with Promise-based connection pooling
- **Connection Configuration:**
  - Local: `localhost:3306`, Database: `whatsapp_ecommerce`, User: `root`
  - Cloud / Production: `gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000`, SSL enabled with TLS 1.2
  - Pool Settings: `connectionLimit: 10`, `waitForConnections: true`, `enableKeepAlive: true`, `charset: utf8mb4`
- **Automatic Self-Healing Schema Migration:**
  - Integrated into `server/config/db.js` (`initDatabaseSchema()`). On every server boot, it automatically inspects `INFORMATION_SCHEMA.COLUMNS` and provisions missing columns (`admins.mobile_number`, `users.role`, index definitions).

---

## 3. Database Schema & Data Models

The database schema (`database/schema.sql`) consists of 10 interconnected tables:

| Table Name | Description | Key Indexes & Foreign Keys |
|---|---|---|
| `users` | Customer & Admin mobile accounts | `mobile_number` (UNIQUE), `idx_users_role`, `idx_users_status` |
| `admins` | Administrative accounts | `username` (UNIQUE), `mobile_number`, `idx_admins_mobile` |
| `categories` | Product classification taxonomy | `category_name` (UNIQUE), `idx_category_name` |
| `products` | Inventory catalog & pricing | `sku` (UNIQUE), `category_id` (FK -> `categories.id` ON DELETE RESTRICT), `idx_product_status`, `idx_product_price`, `idx_product_stock` |
| `product_images` | Gallery & primary product visuals | `product_id` (FK -> `products.id` ON DELETE CASCADE), `idx_product_images_pid` |
| `stock_history` | Audit trail for inventory modifications | `product_id` (FK -> `products.id` ON DELETE CASCADE), `idx_stock_history_pid` |
| `website_settings` | Global store settings & invoice JSON | Store metadata, logo, WhatsApp number, invoice template settings |
| `enquiries` | WhatsApp orders & customer submissions | `user_id` (FK -> `users.id` ON DELETE SET NULL), `idx_enquiries_status` |
| `enquiry_items` | Line items belonging to each enquiry | `enquiry_id` (FK -> `enquiries.id` ON DELETE CASCADE), `product_id` (FK -> `products.id` ON DELETE SET NULL) |
| `otp_verifications` | Mobile verification codes (mock/live) | `mobile_number`, `idx_otp_expires` |

---

## 4. API Architecture & Route Catalog

### 4.1 Public Endpoints
- `GET /api/health`: System health and timestamp check.
- `GET /download/app` & `/downloads/RojaTraders.apk`: Direct Android application package download.
- `GET /api/settings`: Store configuration, contact details, delivery policies.
- `GET /api/banners`: Active promotional banners for homepage carousel.
- `GET /api/invoices/:invoiceNumber`: Public digital invoice data for customers.
- `GET /api/invoices/:invoiceNumber/image`: High-resolution visual SVG bill rendering.
- `POST /api/activity/heartbeat`: Customer presence ping for live admin visitor counter.

### 4.2 Authentication & User Endpoints (`/api/auth`)
- `POST /api/auth/register`: Customer account creation with mobile validation and password hashing.
- `POST /api/auth/login`: Unified customer login (returns JWT token excluding password hash).
- `POST /api/auth/request-otp`: Request 6-digit verification code for order verification.
- `POST /api/auth/verify-otp`: Validate 6-digit OTP code against hash.
- `POST /api/auth/forgot-password/verify-mobile`: Direct mobile check for password reset.
- `POST /api/auth/forgot-password/change`: Direct password update with uppercase/number/special-character enforcement.
- `GET /api/auth/me`: Authenticated customer profile retrieval (requires JWT Bearer).
- `PUT /api/auth/profile`: Customer profile update (name, email, address).

### 4.3 Catalog & Cart Endpoints
- `GET /api/products`: Paginated product catalog with category filter, sorting, and availability check.
- `GET /api/products/suggestions?q=`: Instant multi-field autocomplete search (<10ms latency).
- `GET /api/products/:id`: Full product detail with image gallery and specifications.
- `GET /api/categories`: Complete list of active product categories.
- `POST /api/enquiries`: Create WhatsApp order enquiry (enforces ₹200 minimum threshold, validates stock, returns clean WhatsApp message).
- `GET /api/enquiries/my-orders`: Retrieve logged-in customer's order history with status tracking.

### 4.4 Admin Management Endpoints (`/api/admin`)
- `POST /api/admin/login`: Role-Based Access Control login supporting username or mobile number.
- `GET /api/admin/dashboard`: Real-time business analytics (revenue, enquiries, live visitors, out-of-stock count).
- `GET /api/admin/live-visitors`: Online active customer count for real-time indicator.
- `GET /api/admin/profile` & `PUT /api/admin/profile`: Editable admin profile & mobile number.
- `GET /api/admin/products` & `POST /api/admin/products`: Product creation with multi-image handling.
- `PUT /api/admin/products/:id` & `DELETE /api/admin/products/:id`: Product update and deletion.
- `GET /api/admin/stock` & `PUT /api/admin/stock/:id`: Real-time stock audit and inline increment/decrement.
- `GET /api/admin/enquiries` & `PUT /api/admin/enquiries/:id`: Order management and status updates (`pending` -> `contacted` -> `completed` / `rejected`).
- `DELETE /api/admin/enquiries/:id` & `DELETE /api/admin/enquiries/batch`: Single and bulk order cleanup.
- `GET /api/admin/customers` & `DELETE /api/admin/customers/:id`: Customer management and bulk delete.
- `GET /api/admin/invoice-settings` & `PUT /api/admin/invoice-settings`: Invoice bill configuration with editable Payment QR URL.
- `GET /api/admin/banners` & `POST /api/admin/banners`: Promotional poster management.

---

## 5. Security & Authentication Mechanisms

1. **Authentication:**
   - Stateless JSON Web Tokens (JWT) using `HMAC-SHA256` (`jsonwebtoken`).
   - Distinct secrets: `JWT_SECRET` for customers (`expiresIn: 7d`), `ADMIN_JWT_SECRET` for administrators (`expiresIn: 1d`).
   - Password encryption: `bcryptjs` with 10 salt rounds. Plaintext passwords are never stored or returned in API payloads.
2. **Authorization & RBAC:**
   - Middleware `verifyAdminToken` verifies admin tokens and checks `req.admin.role === 'admin'`.
   - Middleware `verifyCustomerToken` verifies customer tokens.
   - Customers attempting to access `/api/admin/*` receive `401 Unauthorized` or `403 Forbidden`.
   - Storefront route guard in `CustomerLayout.jsx` automatically redirects logged-in admins to `/admin/dashboard`.
3. **Input Sanitization & Injection Defense:**
   - Parameterized SQL queries (`pool.execute` / `pool.query`) prevent SQL injection attacks.
   - XSS defense: SVG and HTML outputs escape dynamic values using XML/HTML character entity replacement.
4. **Rate Limiting:**
   - `generalLimiter`: 300 requests per 15-minute window for public endpoints.
   - `adminApiLimiter`: 100 requests per 15-minute window for administrative actions.

---

## 6. Integrations & Delivery Restrictions

1. **WhatsApp E-Commerce Integration:**
   - WhatsApp Order Dispatch uses standard `https://wa.me/{phone}?text={encodedText}`.
   - Strict Clean-Text Policy: Orders sent via WhatsApp contain clean plain text (Customer name, items, quantity, prices, total) with zero emojis and zero image links.
2. **Delivery Location Restrictions:**
   - Store delivery is strictly limited to **Tiruppur & Avinashi** only.
   - Verified across Navbar announcement, Hero perks, and Cart checkout notice with vector `MapPin` icons.
3. **Payment Architecture:**
   - Offline / Direct UPI Payment: Customers pay upon WhatsApp order confirmation.
   - Digital Invoice Bill features an editable Payment QR Code (GPay / PhonePe / Paytm / Any UPI App) configured via Admin Invoice Settings.
4. **Third-Party Services:**
   - No external paid SMS/OTP gateway dependency in mock mode (`SMS_PROVIDER_MODE=mock`).
   - No external paid payment gateway fees (Razorpay/Stripe omitted intentionally by business design).

---

## 7. Hosting & Deployment Architecture

- **Frontend Hosting:** Render Static Site (`https://roja-traders.onrender.com/`)
  - Build Command: `npm run build`
  - Publish Directory: `client/dist`
  - SPA Routing: Handled via `_redirects` (`/* /index.html 200`), `404.html`, and `render.yaml`.
- **Backend Hosting:** Render Web Service (`https://whatsapp-ecommerce-backend-y08o.onrender.com`)
  - Runtime: Node.js
  - Build Command: `cd server && npm install`
  - Start Command: `cd server && npm start`
- **Database Hosting:** TiDB Cloud Serverless (AWS Tokyo `ap-northeast-1` region) with TLS 1.2 SSL.
- **Repository:** GitHub (`https://github.com/Sudhasun1109/Roja_Traders_e-commerce.git`), tracking branch `main`.
