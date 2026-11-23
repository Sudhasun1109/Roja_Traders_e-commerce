const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { convertGoogleDriveUrl } = require('../utils/urlHelper');

/**
 * Public: Fetch all active promotional banners
 * GET /api/banners
 */
async function getPublicBanners(req, res, next) {
  try {
    const [settings] = await pool.execute('SELECT show_offer_banners FROM website_settings LIMIT 1');
    const showOffers = settings.length > 0 ? (settings[0].show_offer_banners === 1 || settings[0].show_offer_banners === true) : true;

    if (!showOffers) {
      return successResponse(res, { banners: [], show_offer_banners: false });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM offer_banners WHERE is_active = 1 ORDER BY display_order ASC, id DESC'
    );
    return successResponse(res, { banners: rows, show_offer_banners: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Fetch all banners (active and inactive)
 * GET /api/admin/banners
 */
async function getAdminBanners(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM offer_banners ORDER BY display_order ASC, id DESC'
    );
    return successResponse(res, { banners: rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Create a new offer banner
 * POST /api/admin/banners
 */
async function createBanner(req, res, next) {
  try {
    const {
      title,
      subtitle,
      badge_text,
      discount_tag,
      image_url,
      link_url,
      button_text,
      display_order,
      is_active
    } = req.body;

    if (!title || !title.trim()) {
      return errorResponse(res, 'Banner title is required', 400);
    }
    if (!image_url || !image_url.trim()) {
      return errorResponse(res, 'Banner image URL is required', 400);
    }

    const processedImageUrl = convertGoogleDriveUrl(image_url);

    const [result] = await pool.execute(
      `INSERT INTO offer_banners 
        (title, subtitle, badge_text, discount_tag, image_url, link_url, button_text, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        subtitle ? subtitle.trim() : null,
        badge_text ? badge_text.trim() : 'SPECIAL OFFER',
        discount_tag ? discount_tag.trim() : null,
        processedImageUrl,
        link_url ? link_url.trim() : '/products',
        button_text ? button_text.trim() : 'Order on WhatsApp',
        parseInt(display_order || 0, 10),
        is_active !== undefined ? Boolean(is_active) : true
      ]
    );

    const [created] = await pool.execute('SELECT * FROM offer_banners WHERE id = ?', [result.insertId]);

    return successResponse(res, { banner: created[0] }, 'Offer poster created successfully', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Update an existing offer banner
 * PUT /api/admin/banners/:id
 */
async function updateBanner(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      badge_text,
      discount_tag,
      image_url,
      link_url,
      button_text,
      display_order,
      is_active
    } = req.body;

    if (!title || !title.trim()) {
      return errorResponse(res, 'Banner title is required', 400);
    }
    if (!image_url || !image_url.trim()) {
      return errorResponse(res, 'Banner image URL is required', 400);
    }

    const processedImageUrl = convertGoogleDriveUrl(image_url);

    const [result] = await pool.execute(
      `UPDATE offer_banners SET 
        title = ?,
        subtitle = ?,
        badge_text = ?,
        discount_tag = ?,
        image_url = ?,
        link_url = ?,
        button_text = ?,
        display_order = ?,
        is_active = ?
       WHERE id = ?`,
      [
        title.trim(),
        subtitle ? subtitle.trim() : null,
        badge_text ? badge_text.trim() : 'SPECIAL OFFER',
        discount_tag ? discount_tag.trim() : null,
        processedImageUrl,
        link_url ? link_url.trim() : '/products',
        button_text ? button_text.trim() : 'Order on WhatsApp',
        parseInt(display_order || 0, 10),
        is_active !== undefined ? Boolean(is_active) : true,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Offer poster not found', 404);
    }

    const [updated] = await pool.execute('SELECT * FROM offer_banners WHERE id = ?', [id]);

    return successResponse(res, { banner: updated[0] }, 'Offer poster updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Delete an offer banner
 * DELETE /api/admin/banners/:id
 */
async function deleteBanner(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM offer_banners WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Offer poster not found', 404);
    }

    return successResponse(res, { id }, 'Offer poster deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Toggle active status
 * PUT /api/admin/banners/:id/status
 */
async function toggleBannerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const [result] = await pool.execute(
      'UPDATE offer_banners SET is_active = ? WHERE id = ?',
      [Boolean(is_active), id]
    );

    if (result.affectedRows === 0) {
      return errorResponse(res, 'Offer poster not found', 404);
    }

    return successResponse(res, { id, is_active: Boolean(is_active) }, 'Poster status updated');
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get master offer banners toggle status
 * GET /api/admin/banners/master-status
 */
async function getMasterOfferStatus(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT show_offer_banners FROM website_settings LIMIT 1');
    const show = rows.length > 0 ? (rows[0].show_offer_banners === 1 || rows[0].show_offer_banners === true) : true;
    return successResponse(res, { show_offer_banners: show });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Toggle master offer banners status
 * PUT /api/admin/banners/master-status
 */
async function toggleMasterOfferStatus(req, res, next) {
  try {
    const { show_offer_banners } = req.body;
    const isShow = Boolean(show_offer_banners);
    await pool.execute('UPDATE website_settings SET show_offer_banners = ?', [isShow ? 1 : 0]);
    return successResponse(
      res,
      { show_offer_banners: isShow },
      `Homepage offer posters ${isShow ? 'turned ON' : 'turned OFF'}`
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  getMasterOfferStatus,
  toggleMasterOfferStatus
};
