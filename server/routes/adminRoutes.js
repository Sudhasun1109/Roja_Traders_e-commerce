const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const stockController = require('../controllers/stockController');
const enquiryController = require('../controllers/enquiryController');
const bannerController = require('../controllers/bannerController');
const { authenticateAdmin } = require('../middleware/adminAuthMiddleware');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

// Admin Authentication (Unprotected)
router.post('/login', adminLoginLimiter, adminController.adminLogin);

// All subsequent admin routes require valid Admin JWT
router.use(authenticateAdmin);

// Dashboard overview & statistics
router.get('/dashboard', adminController.getDashboardOverview);
router.get('/live-visitors', adminController.getLiveVisitors);

// Admin Profile & Security
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);
router.put('/change-password', adminController.changePassword);

// Product CRUD
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Category CRUD
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Stock Management
router.get('/stock', stockController.getStockInventory);
router.put('/stock/:id', stockController.updateProductStock);
router.get('/stock-history', stockController.getStockHistory);

// Customer Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/bulk-delete', adminController.bulkDeleteUsers);

// Website Settings
router.get('/settings', adminController.getWebsiteSettings);
router.put('/settings', adminController.updateWebsiteSettings);

// Invoice Template & Format Configuration
router.get('/invoice-settings', enquiryController.getInvoiceSettings);
router.put('/invoice-settings', enquiryController.updateInvoiceSettings);

// Enquiries Management
router.get('/enquiries', enquiryController.getAdminEnquiries);
router.get('/enquiries/:id', enquiryController.getAdminEnquiryById);
router.put('/enquiries/:id/status', enquiryController.updateEnquiryStatus);
router.delete('/enquiries/:id', enquiryController.deleteEnquiry);
router.post('/enquiries/bulk-delete', enquiryController.bulkDeleteEnquiries);

// Offer Posters & Banners Management
router.get('/banners/master-status', bannerController.getMasterOfferStatus);
router.put('/banners/master-status', bannerController.toggleMasterOfferStatus);
router.get('/banners', bannerController.getAdminBanners);
router.post('/banners', bannerController.createBanner);
router.put('/banners/:id', bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);
router.put('/banners/:id/status', bannerController.toggleBannerStatus);

module.exports = router;
