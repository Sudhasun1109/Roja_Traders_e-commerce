const pool = require('../config/db');
const {
  getAdminWhatsAppNumber,
  getInvoiceSettingsFromDB,
  generateWhatsAppInvoice,
  buildWhatsAppUrl
} = require('../services/whatsappService');
const { generateInvoiceSVG } = require('../services/invoiceImageService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

/**
 * Customer: Create WhatsApp Enquiry & Generate Bill / Invoice
 * Validates stock and prices on backend, generates unique Invoice Number,
 * saves record to DB, and returns WhatsApp Bill text and click-to-chat URL
 * POST /api/enquiries
 */
async function createEnquiry(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { items, customerName, customerMobile } = req.body;

    // Sanitize customer inputs to prevent script injection (XSS)
    const sanitizeText = (str) => String(str || '').replace(/[<>]/g, '').trim();

    // Customer info (mobile is optional since customer orders directly via their own WhatsApp account)
    const name = sanitizeText(customerName || (req.user && req.user.name) || 'Customer');
    const mobile = sanitizeText(customerMobile || (req.user && req.user.mobile_number) || 'Direct WhatsApp');
    const userId = req.user ? req.user.id : null;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Please select at least one product to generate invoice and order', 400);
    }

    await connection.beginTransaction();

    let totalQuantity = 0;
    let totalAmount = 0;
    const validatedItems = [];

    // Check each product against database stock and price
    for (const item of items) {
      const productId = item.productId || item.id || item.product_id;
      const requestedQty = parseInt(item.quantity || 1, 10);

      if (!productId || requestedQty <= 0) {
        await connection.rollback();
        return errorResponse(res, 'Invalid product or quantity specified', 400);
      }

      const [pRows] = await connection.execute(
        'SELECT id, product_name, tamil_name, price, discount_price, stock_quantity, status FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );

      if (pRows.length === 0) {
        await connection.rollback();
        return errorResponse(res, `Product with ID ${productId} does not exist`, 404);
      }

      const product = pRows[0];

      if (product.status !== 'active') {
        await connection.rollback();
        return errorResponse(
          res,
          `"${product.product_name}" is currently unavailable. Please remove it from your bill.`,
          400
        );
      }

      // Stock validation rule: do not allow ordering quantities greater than available stock
      if (requestedQty > product.stock_quantity) {
        await connection.rollback();
        return errorResponse(
          res,
          `Insufficient stock for "${product.product_name}". Available stock is only ${product.stock_quantity}.`,
          400
        );
      }

      // Use true server price (discount price if active)
      const unitPrice = product.discount_price !== null ? parseFloat(product.discount_price) : parseFloat(product.price);
      const subtotal = unitPrice * requestedQty;

      totalQuantity += requestedQty;
      totalAmount += subtotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.product_name,
        tamil_name: product.tamil_name || null,
        unit_price: unitPrice,
        quantity: requestedQty,
        previous_stock: product.stock_quantity,
        subtotal
      });
    }

    // Minimum order amount criteria: Must be ₹200 or above
    if (totalAmount < 200) {
      await connection.rollback();
      return errorResponse(
        res,
        `Minimum order amount is ₹200. Current total is ₹${totalAmount.toFixed(0)}. Please add items worth ₹${(200 - totalAmount).toFixed(0)} more to place your order.`,
        400
      );
    }

    // Load invoice settings
    const invoiceSettings = await getInvoiceSettingsFromDB();
    const prefix = invoiceSettings.invoice_prefix || 'RT-INV-';
    const year = new Date().getFullYear();

    // Query sequence count for clean sequential invoice number
    const [countResult] = await connection.execute('SELECT COUNT(*) AS total FROM enquiries');
    const seq = String((countResult[0].total || 0) + 1).padStart(4, '0');
    let invoiceNumber = `${prefix}${year}-${seq}`;

    // Verify invoice_number uniqueness; if collision occurs, append short random hex
    const [existing] = await connection.execute('SELECT id FROM enquiries WHERE invoice_number = ?', [invoiceNumber]);
    if (existing.length > 0) {
      const randSuffix = Math.floor(10 + Math.random() * 90);
      invoiceNumber = `${prefix}${year}-${seq}-${randSuffix}`;
    }

    // Insert into enquiries table with invoice_number
    const [enquiryResult] = await connection.execute(
      `INSERT INTO enquiries 
        (user_id, invoice_number, customer_name, customer_mobile, total_amount, total_quantity, enquiry_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, invoiceNumber, name, mobile, totalAmount, totalQuantity]
    );

    const enquiryId = enquiryResult.insertId;

    // Insert enquiry items and reduce stock for ordered items
    for (const vItem of validatedItems) {
      // 1. Insert item record
      await connection.execute(
        `INSERT INTO enquiry_items 
          (enquiry_id, product_id, product_name, tamil_name, unit_price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          enquiryId,
          vItem.product_id,
          vItem.product_name,
          vItem.tamil_name,
          vItem.unit_price,
          vItem.quantity,
          vItem.subtotal
        ]
      );

      // 2. Reduce stock quantity in products table
      const prevStock = vItem.previous_stock;
      const newStock = Math.max(0, prevStock - vItem.quantity);
      await connection.execute(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [newStock, vItem.product_id]
      );

      // 3. Log stock reduction in stock_history audit log
      await connection.execute(
        `INSERT INTO stock_history 
          (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
         VALUES (?, ?, ?, 'decrease', ?, ?)`,
        [
          vItem.product_id,
          prevStock,
          newStock,
          `Customer Order placed: ${invoiceNumber} (Qty: ${vItem.quantity})`,
          name || 'Customer'
        ]
      );
    }

    await connection.commit();

    // Fetch dynamic admin WhatsApp number from website_settings
    const adminWhatsApp = await getAdminWhatsAppNumber();

    // Determine current host URL for the digital bill link
    const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;

    // Generate formatted WhatsApp Bill / Invoice text
    const messageText = generateWhatsAppInvoice({
      invoiceNumber,
      customerName: name,
      customerMobile: mobile,
      items: validatedItems,
      totalQuantity,
      totalAmount,
      invoiceSettings,
      baseUrl: origin
    });

    const whatsappUrl = buildWhatsAppUrl(adminWhatsApp, messageText);

    return successResponse(
      res,
      {
        enquiryId,
        invoiceNumber,
        customerName: name,
        customerMobile: mobile,
        totalQuantity,
        totalAmount,
        whatsappNumber: adminWhatsApp,
        messageText,
        whatsappUrl,
        invoiceUrl: `${origin}/invoice/${invoiceNumber}`
      },
      'Invoice created successfully. Launching WhatsApp...',
      201
    );
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Public: Get Full Invoice Details for viewing & printing
 * GET /api/invoices/:invoiceNumber
 */
async function getPublicInvoice(req, res, next) {
  try {
    const { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return errorResponse(res, 'Invoice number is required', 400);
    }

    const [rows] = await pool.execute(
      `SELECT e.*, u.name AS user_name, u.mobile_number AS user_mobile
       FROM enquiries e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.invoice_number = ? OR e.id = ?`,
      [invoiceNumber, invoiceNumber]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Invoice not found', 404);
    }

    const invoice = rows[0];
    const [items] = await pool.execute(
      `SELECT ei.*, p.tamil_name AS product_tamil_name, p.sku,
       (SELECT image_url FROM product_images WHERE product_id = ei.product_id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image_url
       FROM enquiry_items ei
       LEFT JOIN products p ON ei.product_id = p.id
       WHERE ei.enquiry_id = ?`,
      [invoice.id]
    );

    invoice.items = items.map((item) => ({
      ...item,
      tamil_name: item.tamil_name || item.product_tamil_name || null,
      unit_price: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal)
    }));
    invoice.total_amount = parseFloat(invoice.total_amount);

    const invoiceSettings = await getInvoiceSettingsFromDB();

    return successResponse(res, {
      invoice,
      settings: invoiceSettings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get all customer enquiries
 * GET /api/admin/enquiries
 */
async function getAdminEnquiries(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('e.enquiry_status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push('(e.customer_name LIKE ? OR e.customer_mobile LIKE ? OR e.invoice_number LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM enquiries e ${whereClause}`;
    const [countResult] = await pool.execute(countSql, params);
    const total = countResult[0].total;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const querySql = `
      SELECT 
        e.*,
        u.mobile_number AS registered_mobile
      FROM enquiries e
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [enquiries] = await pool.execute(querySql, params);

    // Fetch items for each enquiry in current page
    for (const item of enquiries) {
      const [items] = await pool.execute(
        `SELECT ei.*, p.sku, p.tamil_name AS product_tamil_name,
         (SELECT image_url FROM product_images WHERE product_id = ei.product_id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image_url
         FROM enquiry_items ei
         LEFT JOIN products p ON ei.product_id = p.id
         WHERE ei.enquiry_id = ?`,
        [item.id]
      );
      item.items = items.map((i) => ({
        ...i,
        tamil_name: i.tamil_name || i.product_tamil_name || null
      }));
      item.total_amount = parseFloat(item.total_amount);
    }

    return successResponse(res, {
      enquiries,
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
 * Admin: Get enquiry by ID
 * GET /api/admin/enquiries/:id
 */
async function getAdminEnquiryById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT e.*, u.name AS user_name, u.mobile_number AS user_mobile
       FROM enquiries e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'Enquiry not found', 404);
    }

    const enquiry = rows[0];
    const [items] = await pool.execute(
      `SELECT ei.*, p.sku, p.stock_quantity, p.tamil_name AS product_tamil_name,
       (SELECT image_url FROM product_images WHERE product_id = ei.product_id ORDER BY is_primary DESC, id ASC LIMIT 1) AS image_url
       FROM enquiry_items ei
       LEFT JOIN products p ON ei.product_id = p.id
       WHERE ei.enquiry_id = ?`,
      [id]
    );

    enquiry.items = items.map((i) => ({
      ...i,
      tamil_name: i.tamil_name || i.product_tamil_name || null
    }));
    enquiry.total_amount = parseFloat(enquiry.total_amount);

    return successResponse(res, { enquiry });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update enquiry status with automatic stock flow synchronization
 * PUT /api/admin/enquiries/:id/status
 */
async function updateEnquiryStatus(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    let { enquiry_status, notes } = req.body;

    if (!enquiry_status) {
      connection.release();
      return errorResponse(res, 'Enquiry status is required', 400);
    }

    if (enquiry_status === 'rejection') {
      enquiry_status = 'rejected';
    }

    const validStatuses = ['pending', 'completed', 'rejected', 'cancelled', 'contacted'];
    if (!validStatuses.includes(enquiry_status)) {
      connection.release();
      return errorResponse(res, 'Invalid enquiry status. Must be pending, completed, contacted, rejected, or cancelled', 400);
    }

    await connection.beginTransaction();

    const [enquiries] = await connection.execute(
      'SELECT id, invoice_number, enquiry_status FROM enquiries WHERE id = ? FOR UPDATE',
      [id]
    );

    if (enquiries.length === 0) {
      await connection.rollback();
      connection.release();
      return errorResponse(res, 'Enquiry not found', 404);
    }

    const currentEnquiry = enquiries[0];
    const oldStatus = currentEnquiry.enquiry_status;
    const isOldCancelled = oldStatus === 'cancelled' || oldStatus === 'rejected';
    const isNewCancelled = enquiry_status === 'cancelled' || enquiry_status === 'rejected';
    const adminUser = req.admin ? req.admin.username : (req.user ? req.user.username : 'admin');

    // 1. If transitioning from active -> cancelled or rejected: RESTORE STOCK
    if (!isOldCancelled && isNewCancelled) {
      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM enquiry_items WHERE enquiry_id = ?',
        [id]
      );
      for (const item of items) {
        const [pRows] = await connection.execute(
          'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );
        if (pRows.length > 0) {
          const prev = pRows[0].stock_quantity;
          const next = prev + item.quantity;
          await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [next, item.product_id]);
          await connection.execute(
            `INSERT INTO stock_history 
              (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
             VALUES (?, ?, ?, 'increase', ?, ?)`,
            [
              item.product_id,
              prev,
              next,
              `Order ${enquiry_status}: ${currentEnquiry.invoice_number} (Restored ${item.quantity} pcs)`,
              adminUser
            ]
          );
        }
      }
    }

    // 2. If transitioning from cancelled/rejected -> active: RE-DEDUCT STOCK
    if (isOldCancelled && !isNewCancelled) {
      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM enquiry_items WHERE enquiry_id = ?',
        [id]
      );
      for (const item of items) {
        const [pRows] = await connection.execute(
          'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );
        if (pRows.length > 0) {
          const prev = pRows[0].stock_quantity;
          const next = Math.max(0, prev - item.quantity);
          await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [next, item.product_id]);
          await connection.execute(
            `INSERT INTO stock_history 
              (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
             VALUES (?, ?, ?, 'decrease', ?, ?)`,
            [
              item.product_id,
              prev,
              next,
              `Order re-activated (${enquiry_status}): ${currentEnquiry.invoice_number} (Deducted ${item.quantity} pcs)`,
              adminUser
            ]
          );
        }
      }
    }

    await connection.execute(
      'UPDATE enquiries SET enquiry_status = ?, notes = COALESCE(?, notes) WHERE id = ?',
      [enquiry_status, notes !== undefined ? notes : null, id]
    );

    await connection.commit();
    connection.release();

    return successResponse(res, { id, enquiry_status, notes }, `Enquiry status updated to ${enquiry_status}`);
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
}

/**
 * Admin: Get invoice template configuration
 * GET /api/admin/invoice-settings
 */
async function getInvoiceSettings(req, res, next) {
  try {
    const settings = await getInvoiceSettingsFromDB();
    return successResponse(res, { settings });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update invoice template configuration
 * PUT /api/admin/invoice-settings
 */
async function updateInvoiceSettings(req, res, next) {
  try {
    const {
      company_name,
      invoice_title,
      invoice_prefix,
      tagline,
      address,
      contact_number,
      email,
      gstin,
      fssai,
      show_tamil_name,
      tax_rate,
      tax_label,
      upi_id,
      payment_qr_url,
      terms,
      footer_note
    } = req.body;

    if (!company_name || !company_name.trim()) {
      return errorResponse(res, 'Company name is required for invoice bill', 400);
    }

    const updated = {
      company_name: company_name.trim(),
      invoice_title: (invoice_title || 'ORDER INVOICE / ESTIMATE BILL').trim(),
      invoice_prefix: (invoice_prefix || 'RT-INV-').trim(),
      tagline: (tagline || '').trim(),
      address: (address || '').trim(),
      contact_number: (contact_number || '').trim(),
      email: (email || '').trim(),
      gstin: (gstin || '').trim(),
      fssai: (fssai || '').trim(),
      show_tamil_name: Boolean(show_tamil_name),
      tax_rate: Math.max(0, parseFloat(tax_rate || 0)),
      tax_label: (tax_label || 'GST / Tax').trim(),
      upi_id: (upi_id || '').trim(),
      payment_qr_url: (payment_qr_url || '').trim(),
      terms: (terms || '').trim(),
      footer_note: (footer_note || '').trim()
    };

    await pool.execute(
      'UPDATE website_settings SET invoice_settings = ? LIMIT 1',
      [JSON.stringify(updated)]
    );

    return successResponse(res, { settings: updated }, 'Invoice format settings updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Public: Get invoice as a high-quality visual SVG Bill Image
 * GET /api/invoices/:invoiceNumber/image
 */
async function getInvoiceImage(req, res, next) {
  try {
    let { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return errorResponse(res, 'Invoice number is required', 400);
    }
    // Remove .svg or .png extension if present
    invoiceNumber = invoiceNumber.replace(/\.(svg|png)$/i, '');

    const [rows] = await pool.execute(
      `SELECT e.*, u.name AS user_name, u.mobile_number AS user_mobile
       FROM enquiries e
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.invoice_number = ? OR e.id = ?`,
      [invoiceNumber, invoiceNumber]
    );

    if (rows.length === 0) {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(404).send('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150" viewBox="0 0 400 150"><rect width="400" height="150" fill="#fee2e2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#dc2626" font-family="sans-serif" font-size="16" font-weight="bold">Invoice Not Found</text></svg>');
    }

    const invoice = rows[0];
    const [items] = await pool.execute(
      `SELECT ei.*, p.tamil_name AS product_tamil_name
       FROM enquiry_items ei
       LEFT JOIN products p ON ei.product_id = p.id
       WHERE ei.enquiry_id = ?`,
      [invoice.id]
    );

    invoice.items = items.map((item) => ({
      ...item,
      tamil_name: item.tamil_name || item.product_tamil_name || null,
      unit_price: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal)
    }));
    invoice.total_amount = parseFloat(invoice.total_amount);

    const settings = await getInvoiceSettingsFromDB();
    const svg = generateInvoiceSVG(invoice, settings);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  } catch (error) {
    next(error);
  }
}

/**
 * Customer: Get personal order history
 * GET /api/enquiries/my-orders
 */
async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const rawMobile = String(req.user.mobile_number || '').replace(/[^0-9]/g, '');
    const last10 = rawMobile.slice(-10);
    const with91 = '91' + last10;
    const withPlus91 = '+91' + last10;

    const [orders] = await pool.execute(
      `SELECT 
        e.id,
        e.invoice_number,
        e.customer_name,
        e.customer_mobile,
        e.total_amount,
        e.total_quantity,
        e.enquiry_status,
        e.notes,
        e.created_at
      FROM enquiries e
      WHERE e.user_id = ? 
         OR e.customer_mobile = ? 
         OR e.customer_mobile = ? 
         OR e.customer_mobile = ?
      ORDER BY e.created_at DESC`,
      [userId, last10, with91, withPlus91]
    );

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await pool.execute(
        `SELECT ei.id, ei.product_name, ei.tamil_name, ei.unit_price, ei.quantity, ei.subtotal
         FROM enquiry_items ei
         WHERE ei.enquiry_id = ?`,
        [order.id]
      );
      order.total_amount = parseFloat(order.total_amount);
      order.items = items.map(it => ({
        ...it,
        unit_price: parseFloat(it.unit_price),
        subtotal: parseFloat(it.subtotal)
      }));
    }

    return successResponse(res, { orders }, 'Customer orders retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete single enquiry (restores stock if order was active)
 * DELETE /api/admin/enquiries/:id
 */
async function deleteEnquiry(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [rows] = await connection.execute('SELECT id, invoice_number, enquiry_status FROM enquiries WHERE id = ?', [id]);
    if (rows.length === 0) {
      connection.release();
      return errorResponse(res, 'Enquiry not found', 404);
    }

    const enq = rows[0];
    const adminUser = req.admin ? req.admin.username : 'admin';

    await connection.beginTransaction();

    // If deleting an active order, restore its item quantities to available stock
    if (enq.enquiry_status !== 'cancelled' && enq.enquiry_status !== 'rejected') {
      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM enquiry_items WHERE enquiry_id = ?',
        [id]
      );
      for (const item of items) {
        const [pRows] = await connection.execute(
          'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
          [item.product_id]
        );
        if (pRows.length > 0) {
          const prev = pRows[0].stock_quantity;
          const next = prev + item.quantity;
          await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [next, item.product_id]);
          await connection.execute(
            `INSERT INTO stock_history 
              (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
             VALUES (?, ?, ?, 'increase', ?, ?)`,
            [
              item.product_id,
              prev,
              next,
              `Order deleted: ${enq.invoice_number} (Restored ${item.quantity} pcs)`,
              adminUser
            ]
          );
        }
      }
    }

    await connection.execute('DELETE FROM enquiry_items WHERE enquiry_id = ?', [id]);
    await connection.execute('DELETE FROM enquiries WHERE id = ?', [id]);
    await connection.commit();
    connection.release();

    return successResponse(res, { id }, 'Enquiry deleted and stock restored successfully');
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
}

/**
 * Admin: Bulk delete enquiries (restores stock for active orders)
 * POST /api/admin/enquiries/bulk-delete
 */
async function bulkDeleteEnquiries(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      connection.release();
      return errorResponse(res, 'Please provide an array of enquiry IDs to delete', 400);
    }

    const cleanIds = ids.map(Number).filter(id => Number.isInteger(id) && id > 0);
    if (cleanIds.length === 0) {
      connection.release();
      return errorResponse(res, 'No valid enquiry IDs provided', 400);
    }

    const adminUser = req.admin ? req.admin.username : 'admin';

    await connection.beginTransaction();

    // Query all target enquiries to check status and restore stock for active ones
    const placeholders = cleanIds.map(() => '?').join(',');
    const [enquiries] = await connection.execute(
      `SELECT id, invoice_number, enquiry_status FROM enquiries WHERE id IN (${placeholders})`,
      cleanIds
    );

    for (const enq of enquiries) {
      if (enq.enquiry_status !== 'cancelled' && enq.enquiry_status !== 'rejected') {
        const [items] = await connection.execute(
          'SELECT product_id, quantity FROM enquiry_items WHERE enquiry_id = ?',
          [enq.id]
        );
        for (const item of items) {
          const [pRows] = await connection.execute(
            'SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE',
            [item.product_id]
          );
          if (pRows.length > 0) {
            const prev = pRows[0].stock_quantity;
            const next = prev + item.quantity;
            await connection.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [next, item.product_id]);
            await connection.execute(
              `INSERT INTO stock_history 
                (product_id, previous_stock, updated_stock, change_type, notes, updated_by)
               VALUES (?, ?, ?, 'increase', ?, ?)`,
              [
                item.product_id,
                prev,
                next,
                `Order bulk-deleted: ${enq.invoice_number} (Restored ${item.quantity} pcs)`,
                adminUser
              ]
            );
          }
        }
      }
    }

    await connection.execute(`DELETE FROM enquiry_items WHERE enquiry_id IN (${placeholders})`, cleanIds);
    const [result] = await connection.execute(`DELETE FROM enquiries WHERE id IN (${placeholders})`, cleanIds);
    await connection.commit();
    connection.release();

    return successResponse(
      res,
      { deletedCount: result.affectedRows, ids: cleanIds },
      `${result.affectedRows} enquiries deleted and stock restored successfully`
    );
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
}

module.exports = {
  createEnquiry,
  getMyOrders,
  getPublicInvoice,
  getInvoiceImage,
  getAdminEnquiries,
  getAdminEnquiryById,
  updateEnquiryStatus,
  getInvoiceSettings,
  updateInvoiceSettings,
  deleteEnquiry,
  bulkDeleteEnquiries
};
