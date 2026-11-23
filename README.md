# WhatsApp-Based E-Commerce Product Showcase & Enquiry Platform

A modern, responsive, high-performance E-Commerce Product Showcase and WhatsApp Direct Ordering Platform built with **React (Vite) + Tailwind CSS**, **Node.js (Express)**, and **MySQL (mysql2)**.

Instead of traditional cart payment gateways, customers browse products, view specifications, adjust quantities, add items to a shopping cart, and generate a pre-formatted order enquiry dispatched directly to the admin's official WhatsApp number.

---

## 🌟 Key Highlights

- **Direct WhatsApp Ordering**: No payment gateways or sensitive card details. Orders are converted into clean, URL-encoded WhatsApp messages (`https://wa.me/ADMIN_NUMBER?text=...`) and sent to the seller.
- **Dynamic Admin WhatsApp Routing**: The destination WhatsApp number is dynamically pulled from the MySQL database (`website_settings` table). Any update in the admin dashboard instantly affects all future orders.
- **Backend Stock Validation**: Prevents ordering quantities greater than available inventory before any enquiry is generated.
- **Passwordless Mobile OTP Customer Authentication**: Customers log in or auto-register using only their mobile number verified with cryptographic 6-digit OTPs (hashed using bcrypt; never stored in plain text).
- **Dedicated Admin Control Panel (`/admin`)**:
  - Separate JWT authentication and role-based access.
  - Complete Product CRUD (Title, Description, Price, Discount Price, SKU, Category, Image gallery & uploader, Key-Value Specifications).
  - Dedicated Stock & Inventory Manager with increase/decrease/set modes and complete audit history logs.
  - Category Management with active product count counters and safe-delete validation.
  - Enquiry Management with status tracking (`pending`, `contacted`, `completed`, `cancelled`) and direct "Reply on WhatsApp" button.
  - Customer directory with search and active/inactive toggles.
  - Comprehensive Dashboard statistics and category distribution visual metrics.

---

## 🛠️ Technology Stack

### Frontend:
- **React.js 18** (Vite build tool)
- **Tailwind CSS** (Custom theme with WhatsApp & brand palette)
- **React Router DOM 7**
- **Axios** (With request/response interceptors for both customer and admin tokens)
- **Lucide React** (Modern iconography)

### Backend:
- **Node.js** & **Express.js**
- **REST API Architecture**
- **JWT Authentication** (Separate secrets for customer and admin sessions)
- **bcryptjs** (Password hashing & OTP hash verification)
- **Helmet & CORS** (Security headers & origin control)
- **express-rate-limit** (Brute-force protection on OTP & login endpoints)
- **Multer** (Validated image uploads)

### Database:
- **MySQL 8.0**
- **mysql2/promise** connection pool
- Fully normalized relational schema with foreign keys, indexes, and cascades.

---

## 📂 Project Architecture

```
project/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── admin/              # Admin pages & components
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminProfile.jsx
│   │   │   ├── AdminProtectedRoute.jsx
│   │   │   ├── CategoryManagement.jsx
│   │   │   ├── CustomerManagement.jsx
│   │   │   ├── EnquiryManagement.jsx
│   │   │   ├── ProductManagement.jsx
│   │   │   ├── StockManagement.jsx
│   │   │   └── WebsiteSettings.jsx
│   │   ├── components/         # Reusable UI components
│   │   │   ├── CartDrawer.jsx
│   │   │   ├── FloatingWhatsApp.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── OtpModal.jsx
│   │   │   └── ProductCard.jsx
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── SettingsContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── layouts/
│   │   │   └── CustomerLayout.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   └── ProductListPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                      # Express REST API
│   ├── config/
│   │   └── db.js               # MySQL pool configuration
│   ├── controllers/            # Route controllers
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── enquiryController.js
│   │   ├── productController.js
│   │   └── stockController.js
│   ├── middleware/             # Security & auth middlewares
│   │   ├── adminAuthMiddleware.js
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── uploadMiddleware.js
│   ├── routes/                 # Express route modules
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── enquiryRoutes.js
│   │   ├── productRoutes.js
│   │   └── uploadRoutes.js
│   ├── services/               # Business logic
│   │   ├── otpService.js
│   │   └── whatsappService.js
│   ├── scripts/
│   │   └── seed.js             # Automated DB schema & seed runner
│   ├── uploads/                # Product & logo uploads
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── database/
│   ├── schema.sql              # MySQL DDL definitions
│   └── seed.sql                # Initial data (admin, categories, products)
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🗄️ Database Design (MySQL)

The database `whatsapp_ecommerce` consists of 10 normalized tables:

1. **`users`**: Customer profiles (`id`, `name`, `mobile_number`, `is_verified`, `status`, `created_at`).
2. **`admins`**: Administrator credentials (`id`, `username`, `password`, `role`, `created_at`).
3. **`categories`**: Product categories (`id`, `category_name`, `description`, `created_at`).
4. **`products`**: Product details (`id`, `product_name`, `description`, `price`, `discount_price`, `category_id`, `sku`, `stock_quantity`, `status`, `specifications` JSON, `created_at`, `updated_at`).
5. **`product_images`**: Multi-image gallery (`id`, `product_id`, `image_url`, `is_primary`, `created_at`).
6. **`stock_history`**: Inventory audit trail (`id`, `product_id`, `previous_stock`, `updated_stock`, `change_type`, `notes`, `updated_by`, `created_at`).
7. **`website_settings`**: Dynamically configurable store details including `whatsapp_number` (`id`, `website_name`, `logo_url`, `whatsapp_number`, `contact_number`, `address`, `email`, `description`, `social_links`, `footer_text`).
8. **`enquiries`**: WhatsApp customer enquiries (`id`, `user_id`, `customer_name`, `customer_mobile`, `total_amount`, `total_quantity`, `enquiry_status`, `notes`, `created_at`).
9. **`enquiry_items`**: Line items per enquiry (`id`, `enquiry_id`, `product_id`, `product_name`, `unit_price`, `quantity`, `subtotal`).
10. **`otp_verifications`**: Hashed OTP tokens (`id`, `mobile_number`, `otp_hash`, `expires_at`, `verified`, `created_at`).

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **MySQL**: 8.0+ running locally or remotely

### 2. Configure Environment Variables
Inside `server/.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=whatsapp_ecommerce
DB_PORT=3306

# JWT Secrets
JWT_SECRET=customer_jwt_secret_key_whatsapp_showcase_2026
JWT_EXPIRES_IN=7d
ADMIN_JWT_SECRET=admin_jwt_secret_key_whatsapp_showcase_2026
ADMIN_JWT_EXPIRES_IN=1d

# Allowed Frontend Origins
CORS_ORIGIN=http://localhost:5173

# OTP Configuration
OTP_EXPIRY_MINUTES=5
SMS_PROVIDER_MODE=mock
```

### 3. Initialize Database & Seed Data
Run the automated seed script to create all tables and populate realistic sample categories, products, images, and the default admin user:
```bash
cd server
npm run seed
```

### 4. Start the Application

#### Option A: Run Full-Stack with Express serving Built React Frontend
```bash
# In the client directory (build React assets)
cd client
npm run build

# In the server directory (starts both API and UI)
cd ../server
npm start
```
Access the application at: **`http://localhost:5000`**

#### Option B: Run in Concurrent Development Mode
**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Starts API on http://localhost:5000
```

**Terminal 2 (Vite Frontend with Hot Reload):**
```bash
cd client
npm run dev
# Starts Vite on http://localhost:5173 (proxied to port 5000)
```

---

## 🔐 Credentials & Testing Guide

### Default Admin Credentials
- **URL**: `http://localhost:5000/admin` (or `http://localhost:5173/admin` in dev)
- **Username**: `admin`
- **Password**: `admin123`

### Customer Mobile Authentication Flow
1. Click **"Verify Mobile"** in the navbar or click **"Order on WhatsApp"** on any product/cart.
2. Enter any valid 10-digit mobile number (e.g. `9876543210`) and optional name.
3. In `mock` development mode, the generated 6-digit OTP is shown directly in the UI helper card and logged to the server terminal.
4. Enter the 6-digit code to verify. The user account is saved to MySQL, and a verified JWT token is issued.

### WhatsApp Message Format
Generated click-to-chat URL:
```
https://wa.me/919876543210?text=Hello!%20I%20would%20like%20to%20enquire%20about%20the%20following%20products.%0A...
```

Encoded message format matches standard specifications:
```
Hello! I would like to enquire about the following products.

Customer Name: Sudhasun
Mobile Number: +919876543210

Products:
1. Product Name: Urban Edge Premium Oversized Tee
   Price: ₹599
   Quantity: 2
   Subtotal: ₹1198

2. Product Name: AeroGlide Pro Performance Sneakers
   Price: ₹1299
   Quantity: 1
   Subtotal: ₹1299

Total Product Quantity: 3
Total Amount: ₹2497

Please provide more details about availability and delivery.

Thank you!
```

---

## 📡 REST API Reference

### Customer & Auth
- `POST /api/auth/send-otp` - Dispatch 6-digit OTP (rate-limited, hashed in DB).
- `POST /api/auth/verify-otp` - Verify OTP against hash, auto-register customer, return JWT.
- `GET /api/auth/me` - Fetch verified customer profile.
- `POST /api/auth/logout` - Discard session.

### Products & Categories (Public)
- `GET /api/products` - List products with filters (`search`, `category_id`, `min_price`, `max_price`, `in_stock`, `sort`).
- `GET /api/products/:id` - Fetch single product with all images and specifications.
- `GET /api/categories` - List all categories with active product counts.
- `GET /api/settings` - Public store details and current admin WhatsApp number.

### WhatsApp Enquiries
- `POST /api/enquiries` - Validate inventory stock, insert enquiry record, calculate totals, format message, and return WhatsApp URL.

### Admin Console (`/api/admin/*` protected by Admin JWT)
- `POST /api/admin/login` - Admin authentication with bcrypt comparison.
- `GET /api/admin/dashboard` - Aggregated live metrics, low-stock warnings, and category stock breakdown.
- `PUT /api/admin/change-password` - Update admin password with bcrypt hash.
- `POST /api/admin/products` - Create new product with images and specifications.
- `PUT /api/admin/products/:id` - Update existing product and track stock adjustments.
- `DELETE /api/admin/products/:id` - Delete product (with fallback deactivation for items referenced in orders).
- `GET /api/admin/stock` - Current inventory list with stock status tags.
- `PUT /api/admin/stock/:id` - Increase, decrease, or set stock with audit log.
- `GET /api/admin/stock-history` - Complete audit trail of stock adjustments.
- `GET /api/admin/categories` & `POST`, `PUT`, `DELETE` - Category management.
- `GET /api/admin/enquiries` & `PUT /api/admin/enquiries/:id/status` - Review enquiries and update status.
- `GET /api/admin/users` & `PUT /api/admin/users/:id/status` - Customer directory.
- `GET /api/admin/settings` & `PUT /api/admin/settings` - Update store settings and dynamic WhatsApp number.
- `POST /api/upload/single` - Secure file upload for product images and logos.

---

## 🛡️ Security Implementation

- **SQL Injection Prevention**: 100% parameterized queries using MySQL prepared statements through `mysql2/promise`.
- **Password Security**: Bcrypt with salt rounds for admin passwords and customer OTP codes.
- **Cross-Site Scripting & Injection**: Helmet security headers enabled.
- **Rate Limiting**:
  - `otpRateLimiter`: Limits OTP requests to 10 per 5 minutes per IP.
  - `adminLoginLimiter`: Limits login attempts to 20 per 15 minutes to prevent brute-force attacks.
  - `generalLimiter`: Standard 300 requests per 15 minutes for public API traffic.
- **Role Isolation**: Customer tokens cannot access `/api/admin/*`; Admin tokens are validated using a distinct `ADMIN_JWT_SECRET`.
- **Upload Validation**: Multer restricted to safe image formats (`JPEG`, `PNG`, `WebP`, `GIF`) with a 5MB size ceiling.

---

## 🚢 Production Deployment Instructions

1. **Build Client Bundle**:
   ```bash
   cd client
   npm install
   npm run build
   ```
2. **Setup Server & PM2 Process Manager**:
   ```bash
   cd ../server
   npm install --production
   npm install -g pm2
   pm2 start server.js --name "whatsapp-showcase"
   pm2 save
   ```
3. **Nginx Reverse Proxy Configuration**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
4. **SSL Setup (Let's Encrypt Certbot)**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 📄 License
ISC License. Built for modern, direct-to-consumer WhatsApp commerce.
