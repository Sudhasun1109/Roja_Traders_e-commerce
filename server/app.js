const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, adminApiLimiter } = require('./middleware/rateLimiter');
const adminController = require('./controllers/adminController');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Security Headers with proper CSP allowing external product images and fonts
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"]
      }
    }
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during dev/demo
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files for image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Static and direct download routes for Roja Traders App
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.get(['/download/app', '/downloads/RojaTraders.apk'], (req, res) => {
  const apkPath = path.join(__dirname, 'downloads', 'RojaTraders.apk');
  res.download(apkPath, 'RojaTraders.apk', {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive'
    }
  });
});

// Track online customer activity
const visitorTracker = require('./services/visitorTracker');
app.use((req, res, next) => {
  visitorTracker.recordVisitorActivity(req);
  next();
});

// General API rate limiter for standard traffic
app.use('/api', generalLimiter);

// Heartbeat endpoint for active storefront visitors
app.post('/api/activity/heartbeat', (req, res) => {
  visitorTracker.recordVisitorActivity(req);
  res.json({ ok: true, onlineCustomers: visitorTracker.getOnlineCount() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp E-Commerce Product Showcase API'
  });
});

// Public Website Settings, Invoices & Offer Banners
app.get('/api/settings', adminController.getWebsiteSettings);
app.get('/api/banners', require('./controllers/bannerController').getPublicBanners);
app.get('/api/invoices/:invoiceNumber', require('./controllers/enquiryController').getPublicInvoice);
app.get('/api/invoices/:invoiceNumber/image', require('./controllers/enquiryController').getInvoiceImage);

// Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/admin', adminApiLimiter, adminRoutes);
app.use('/api/upload', uploadRoutes);

// Serve frontend static build if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    // If request looks like an API call that wasn't handled, send 404
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
