const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { optionalCustomerAuth, authenticateCustomer } = require('../middleware/authMiddleware');
const { enquiryLimiter } = require('../middleware/rateLimiter');

// Customer WhatsApp Enquiry & Bill generation
router.post('/', enquiryLimiter, optionalCustomerAuth, enquiryController.createEnquiry);

// Authenticated Customer Order History
router.get('/my-orders', authenticateCustomer, enquiryController.getMyOrders);

// Public invoice detail & visual image endpoints
router.get('/invoice/:invoiceNumber', enquiryController.getPublicInvoice);
router.get('/invoice/:invoiceNumber/image', enquiryController.getInvoiceImage);

module.exports = router;
