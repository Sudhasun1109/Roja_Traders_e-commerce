const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Admin: Get stock inventory list with statuses & filters
 * GET /api/admin/stock
 */
async function getStockInventory(req, res, next) {
  try {
    const { status, category_id, search } = req.query;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      conditions.push('(p.product_name LIKE ? OR p.sku LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    if (status === 'out_of_stock') {
      conditions.push('p.stock_quantity <= 0');
    } else if (status === 'low_stock') {
      conditions.push('p.stock_quantity > 0 AND p.stock_quantity <= 5');
    } else if (status === 'in_stock') {
      conditions.push('p.stock_quantity > 5');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        p.id,
        p.product_name,
        p.sku,
        p.price,
        p.discount_price,
        p.stock_quantity,
        p.status,
        c.category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
        CASE
          WHEN p.stock_quantity <= 0 THEN 'Out of Stock'
          WHEN p.stock_quantity <= 5 THEN 'Low Stock'
          ELSE 'In Stock'
        END AS stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.stock_quantity ASC, p.product_name ASC
    `;

    const [rows] = await pool.execute(query, params);
    return successResponse(res, { inventory: rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update stock for a product
 * PUT /api/admin/stock/:id
 * Body: { changeType: 'increase' | 'decrease' | 'set', quantity: number, notes: string }
 */
async function updateProductStock(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { changeType, quantity, notes } = req.body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return errorResponse(res, 'Quantity must be a non-negative whole number', 400);
    }

    const validTypes = ['increase', 'decrease', 'set'];
    if (!validTypes.includes(changeType)) {
      return errorResponse(res, 'Invalid changeType. Must be increase, decrease, or set', 400);
    }

    await connection.beginTransaction();

    const [products] = await connection.execute(
      'SELECT id, product_name, stock_quantity FROM products WHERE id = ? FOR UPDATE',
      [id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return errorResponse(res, 'Product not found', 404);
    }

    const product = products[0];
    const previousStock = product.stock_quantity;
    let newStock = previousStock;

    if (changeType === 'increase') {
      newStock = previousStock + qty;
    } else if (changeType === 'decrease') {
      if (qty > previousStock) {
        await connection.rollback();
        return errorResponse(res, `Cannot decrease by ${qty}. Current stock is only ${previousStock}.`, 400);
      }
      newStock = previousStock - qty;
    } else if (changeType === 'set') {
      newStock = qty;
    }

    // Update product stock
    await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, id]);

    // Insert stock history record
    const adminUser = req.admin ? req.admin.username : 'admin';
    await connection.execute(
      `INSERT INTO stock_history 
        (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, previousStock, newStock, changeType, notes || `Stock updated via admin: ${changeType}`, adminUser]
    );

    await connection.commit();

    return successResponse(
      res,
      {
        productId: id,
        productName: product.product_name,
        previousStock,
        updatedStock: newStock,
        changeType
      },
      'Stock updated successfully'
    );
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Admin: View stock update history
 * GET /api/admin/stock-history
 */
async function getStockHistory(req, res, next) {
  try {
    const { product_id, limit = 50 } = req.query;

    const conditions = [];
    const params = [];

    if (product_id) {
      conditions.push('sh.product_id = ?');
      params.push(parseInt(product_id, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));

    const query = `
      SELECT 
        sh.*,
        p.product_name,
        p.sku
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      ${whereClause}
      ORDER BY sh.created_at DESC
      LIMIT ${limitNum}
    `;

    const [rows] = await pool.execute(query, params);
    return successResponse(res, { history: rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStockInventory,
  updateProductStock,
  getStockHistory
};
