const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Public: Get all categories with product counts
 * GET /api/categories
 */
async function getCategories(req, res, next) {
  try {
    const query = `
      SELECT 
        c.id,
        c.category_name,
        c.tamil_name,
        c.description,
        c.created_at,
        COUNT(p.id) AS product_count,
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.category_name ASC
    `;

    const [rows] = await pool.execute(query);
    return successResponse(res, { categories: rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create category
 * POST /api/admin/categories
 */
async function createCategory(req, res, next) {
  try {
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return errorResponse(res, 'Category name is required', 400);
    }

    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE category_name = ?',
      [category_name.trim()]
    );
    if (existing.length > 0) {
      return errorResponse(res, 'A category with this name already exists', 409);
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name.trim(), description || '']
    );

    return successResponse(
      res,
      {
        id: result.insertId,
        category_name: category_name.trim(),
        description
      },
      'Category created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update category
 * PUT /api/admin/categories/:id
 */
async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return errorResponse(res, 'Category name is required', 400);
    }

    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE category_name = ? AND id != ?',
      [category_name.trim(), id]
    );
    if (existing.length > 0) {
      return errorResponse(res, 'Another category already uses this name', 409);
    }

    const [result] = await pool.execute(
      'UPDATE categories SET category_name = ?, description = ? WHERE id = ?',
      [category_name.trim(), description || '', id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, { id, category_name: category_name.trim(), description }, 'Category updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete category
 * DELETE /api/admin/categories/:id
 */
async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    // Check if category has any products
    const [products] = await pool.execute('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id]);
    if (products.length > 0) {
      return errorResponse(
        res,
        'Cannot delete category because products are assigned to it. Reassign or delete those products first.',
        400
      );
    }

    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return errorResponse(res, 'Category not found', 404);
    }

    return successResponse(res, { id }, 'Category deleted successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
