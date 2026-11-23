const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public product showcase routes
router.get('/', productController.getProducts);
router.get('/suggestions', productController.getSearchSuggestions);
router.get('/:id', productController.getProductById);

module.exports = router;
