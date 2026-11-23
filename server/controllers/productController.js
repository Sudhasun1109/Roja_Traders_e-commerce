const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { convertGoogleDriveUrl } = require('../utils/urlHelper');

/**
 * Helper to format specifications from DB (handles string or JSON object)
 */
function parseSpecifications(specs) {
  if (!specs) return {};
  if (typeof specs === 'object') return specs;
  try {
    return JSON.parse(specs);
  } catch (e) {
    return {};
  }
}

/**
 * Public: Get products with search, filters, pagination, and sorting
 * GET /api/products
 */
async function getProducts(req, res, next) {
  try {
    const {
      search,
      category_id,
      category_name,
      min_price,
      max_price,
      in_stock,
      sort = 'latest',
      page = 1,
      limit = 20,
      include_inactive = 'false'
    } = req.query;

    const conditions = [];
    const params = [];

    // Filter inactive products unless requested by admin context
    if (include_inactive !== 'true') {
      conditions.push('p.status = "active"');

      // For e-commerce customer browsing:
      // Hide out-of-stock items in normal browse/catalog/home view.
      // BUT if user searches (search query present), allow out-of-stock items to be shown in search results with red badge!
      if (!search || !search.trim()) {
        conditions.push('p.stock_quantity > 0');
      }
    }

    // Search query across name, tamil_name, description, sku
    if (search && search.trim()) {
      conditions.push('(p.product_name LIKE ? OR p.tamil_name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(parseInt(category_id, 10));
    } else if (category_name) {
      conditions.push('c.category_name = ?');
      params.push(category_name.trim());
    }

    // Price range
    if (min_price && !isNaN(min_price)) {
      conditions.push('COALESCE(p.discount_price, p.price) >= ?');
      params.push(parseFloat(min_price));
    }
    if (max_price && !isNaN(max_price)) {
      conditions.push('COALESCE(p.discount_price, p.price) <= ?');
      params.push(parseFloat(max_price));
    }

    // Stock availability filter
    if (in_stock === 'true') {
      conditions.push('p.stock_quantity > 0');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'COALESCE(p.discount_price, p.price) ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'COALESCE(p.discount_price, p.price) DESC';
    } else if (sort === 'name_asc') {
      orderBy = 'p.product_name ASC';
    } else if (sort === 'featured') {
      orderBy = 'p.stock_quantity DESC, p.created_at DESC';
    }

    // Count total products matching query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const [countResult] = await pool.execute(countSql, params);
    const total = countResult[0].total;

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Main query
    const querySql = `
      SELECT 
        p.id,
        p.product_name,
        p.tamil_name,
        p.description,
        p.price,
        p.discount_price,
        p.category_id,
        c.category_name,
        c.tamil_name AS category_tamil_name,
        p.sku,
        p.stock_quantity,
        p.status,
        p.specifications,
        p.created_at,
        p.updated_at,
        (
          SELECT image_url 
          FROM product_images 
          WHERE product_id = p.id 
          ORDER BY is_primary DESC, id ASC 
          LIMIT 1
        ) AS primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [products] = await pool.execute(querySql, params);

    const formatted = products.map((item) => ({
      ...item,
      price: parseFloat(item.price),
      discount_price: item.discount_price ? parseFloat(item.discount_price) : null,
      stock_quantity: parseInt(item.stock_quantity, 10),
      specifications: parseSpecifications(item.specifications),
      is_in_stock: item.stock_quantity > 0,
      stock_status: item.stock_quantity <= 0 ? 'Out of Stock' : (item.stock_quantity <= 5 ? 'Low Stock' : 'In Stock')
    }));

    return successResponse(res, {
      products: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public: Get single product by ID with all images and specifications
 * GET /api/products/:id
 */
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return errorResponse(res, 'Invalid product ID format', 400);
    }

    const [rows] = await pool.execute(
      `SELECT 
        p.*,
        c.category_name,
        c.tamil_name AS category_tamil_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    const product = rows[0];

    // Fetch all images
    const [images] = await pool.execute(
      'SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC',
      [id]
    );

    product.price = parseFloat(product.price);
    product.discount_price = product.discount_price ? parseFloat(product.discount_price) : null;
    product.stock_quantity = parseInt(product.stock_quantity, 10);
    product.specifications = parseSpecifications(product.specifications);
    product.images = images;
    product.is_in_stock = product.stock_quantity > 0;
    product.stock_status =
      product.stock_quantity <= 0 ? 'Out of Stock' : (product.stock_quantity <= 5 ? 'Low Stock' : 'In Stock');

    return successResponse(res, { product });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create new product
 * POST /api/admin/products
 */
async function createProduct(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      product_name,
      tamil_name,
      description,
      price,
      discount_price,
      category_id,
      sku,
      stock_quantity = 0,
      status = 'active',
      specifications,
      images = [] // Array of image URLs, e.g. [{ image_url, is_primary }] or string array
    } = req.body;

    if (!product_name || !price || !category_id || !sku) {
      await connection.rollback();
      return errorResponse(res, 'Product name, price, category, and SKU are required', 400);
    }

    // Check SKU uniqueness
    const [skuCheck] = await connection.execute('SELECT id FROM products WHERE sku = ?', [sku.trim()]);
    if (skuCheck.length > 0) {
      await connection.rollback();
      return errorResponse(res, 'A product with this SKU already exists', 409);
    }

    // Format specifications
    let specsJson = null;
    if (specifications) {
      specsJson = typeof specifications === 'string' ? specifications : JSON.stringify(specifications);
    }

    const parsedPrice = parseFloat(price);
    const parsedDiscount = discount_price ? parseFloat(discount_price) : null;
    const parsedStock = parseInt(stock_quantity || 0, 10);

    const [result] = await connection.execute(
      `INSERT INTO products 
        (product_name, tamil_name, description, price, discount_price, category_id, sku, stock_quantity, status, specifications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_name.trim(),
        tamil_name && tamil_name.trim() ? tamil_name.trim() : null,
        description || '',
        parsedPrice,
        parsedDiscount,
        parseInt(category_id, 10),
        sku.trim(),
        parsedStock,
        status,
        specsJson
      ]
    );

    const productId = result.insertId;

    // Log initial stock in stock_history
    if (parsedStock >= 0) {
      await connection.execute(
        `INSERT INTO stock_history (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
         VALUES (?, 0, ?, 'initial', 'Initial inventory batch intake', ?)`,
        [productId, parsedStock, req.admin ? req.admin.username : 'admin']
      );
    }

    // Insert images
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const url = typeof item === 'string' ? item : item.image_url;
        const isPrimary = typeof item === 'object' && item.is_primary !== undefined ? !!item.is_primary : (i === 0);
        if (url && url.trim()) {
          const processedUrl = convertGoogleDriveUrl(url.trim());
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [productId, processedUrl, isPrimary]
          );
        }
      }
    }

    await connection.commit();

    return successResponse(res, { productId }, 'Product created successfully', 201);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Admin: Update product
 * PUT /api/admin/products/:id
 */
async function updateProduct(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      product_name,
      tamil_name,
      description,
      price,
      discount_price,
      category_id,
      sku,
      stock_quantity,
      status,
      specifications,
      images
    } = req.body;

    const [existingRows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Product not found', 404);
    }
    const existing = existingRows[0];

    // Check SKU if changed
    if (sku && sku.trim() !== existing.sku) {
      const [skuCheck] = await connection.execute('SELECT id FROM products WHERE sku = ? AND id != ?', [
        sku.trim(),
        id
      ]);
      if (skuCheck.length > 0) {
        await connection.rollback();
        return errorResponse(res, 'SKU already used by another product', 409);
      }
    }

    let specsJson = existing.specifications;
    if (specifications !== undefined) {
      specsJson = typeof specifications === 'string' ? specifications : JSON.stringify(specifications);
    }

    const updatedStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : existing.stock_quantity;

    // Track stock change if updated here
    if (stock_quantity !== undefined && updatedStock !== existing.stock_quantity) {
      const changeType = updatedStock > existing.stock_quantity ? 'increase' : 'decrease';
      await connection.execute(
        `INSERT INTO stock_history (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
         VALUES (?, ?, ?, ?, 'Stock adjusted during product edit', ?)`,
        [id, existing.stock_quantity, updatedStock, changeType, req.admin ? req.admin.username : 'admin']
      );
    }

    await connection.execute(
      `UPDATE products SET
        product_name = ?,
        tamil_name = ?,
        description = ?,
        price = ?,
        discount_price = ?,
        category_id = ?,
        sku = ?,
        stock_quantity = ?,
        status = ?,
        specifications = ?
       WHERE id = ?`,
      [
        product_name !== undefined ? product_name.trim() : existing.product_name,
        tamil_name !== undefined ? (tamil_name && tamil_name.trim() ? tamil_name.trim() : null) : existing.tamil_name,
        description !== undefined ? description : existing.description,
        price !== undefined ? parseFloat(price) : existing.price,
        discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : existing.discount_price,
        category_id !== undefined ? parseInt(category_id, 10) : existing.category_id,
        sku !== undefined ? sku.trim() : existing.sku,
        updatedStock,
        status !== undefined ? status : existing.status,
        specsJson,
        id
      ]
    );

    // If new image array provided, replace existing or update
    if (Array.isArray(images)) {
      await connection.execute('DELETE FROM product_images WHERE product_id = ?', [id]);
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const url = typeof item === 'string' ? item : item.image_url;
        const isPrimary = typeof item === 'object' && item.is_primary !== undefined ? !!item.is_primary : (i === 0);
        if (url && url.trim()) {
          const processedUrl = convertGoogleDriveUrl(url.trim());
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
            [id, processedUrl, isPrimary]
          );
        }
      }
    }

    await connection.commit();

    return successResponse(res, { id }, 'Product updated successfully');
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Admin: Delete product
 * DELETE /api/admin/products/:id
 */
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    // Check if referenced in previous enquiries
    const [enquiryCheck] = await pool.execute(
      'SELECT id FROM enquiry_items WHERE product_id = ? LIMIT 1',
      [id]
    );

    if (enquiryCheck.length > 0) {
      // Instead of hard-deleting and breaking enquiry history, soft-delete / deactivate product
      await pool.execute('UPDATE products SET status = "inactive" WHERE id = ?', [id]);
      return successResponse(
        res,
        { id, softDeleted: true },
        'Product is referenced in past customer enquiries. It has been marked inactive instead of deleted to protect order history.'
      );
    }

    // Delete product (cascades to product_images and stock_history via foreign keys)
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return errorResponse(res, 'Product not found', 404);
    }

    return successResponse(res, { id }, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Public: Instant Autocomplete Search Suggestions (1+ letters)
 * GET /api/products/suggestions?q=r
 */
async function getSearchSuggestions(req, res, next) {
  try {
    const { q = '', limit = 8 } = req.query;
    const query = q.trim();

    if (!query) {
      return successResponse(res, { suggestions: [] });
    }

    const term = `%${query}%`;
    const startsWith = `${query}%`;
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 8));

    const sql = `
      SELECT 
        p.id,
        p.product_name,
        p.tamil_name,
        p.price,
        p.discount_price,
        p.stock_quantity,
        c.category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
        AND (p.product_name LIKE ? OR p.tamil_name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR c.category_name LIKE ?)
      ORDER BY 
        CASE 
          WHEN p.product_name LIKE ? THEN 1
          WHEN p.product_name LIKE ? THEN 2
          ELSE 3
        END,
        p.stock_quantity > 0 DESC,
        p.product_name ASC
      LIMIT ${limitNum}
    `;

    const [rows] = await pool.execute(sql, [term, term, term, term, term, startsWith, term]);

    const suggestions = rows.map((p) => ({
      id: p.id,
      product_name: p.product_name,
      tamil_name: p.tamil_name,
      price: parseFloat(p.price),
      discount_price: p.discount_price ? parseFloat(p.discount_price) : null,
      effective_price: parseFloat(p.discount_price || p.price),
      stock_quantity: parseInt(p.stock_quantity, 10),
      is_in_stock: p.stock_quantity > 0,
      category_name: p.category_name,
      primary_image: p.primary_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'
    }));

    return successResponse(res, { suggestions });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  getSearchSuggestions,
  createProduct,
  updateProduct,
  deleteProduct
};
