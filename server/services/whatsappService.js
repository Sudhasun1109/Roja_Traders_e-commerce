const pool = require('../config/db');

/**
 * Format clean WhatsApp phone number (wa.me expects digits only, e.g. 919876543210)
 */
function cleanWhatsAppNumber(number) {
  if (!number) return '919597993402';
  let cleaned = String(number).replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Fetch the current admin WhatsApp number dynamically from website_settings table
 */
async function getAdminWhatsAppNumber() {
  try {
    const [rows] = await pool.execute('SELECT whatsapp_number FROM website_settings LIMIT 1');
    if (rows && rows.length > 0 && rows[0].whatsapp_number) {
      return cleanWhatsAppNumber(rows[0].whatsapp_number);
    }
  } catch (err) {
    console.error('Error fetching admin WhatsApp number:', err.message);
  }
  return '919597993402';
}

/**
 * Fetch current invoice settings from website_settings table
 */
async function getInvoiceSettingsFromDB() {
  try {
    const [rows] = await pool.execute('SELECT website_name, address, contact_number, email, invoice_settings FROM website_settings LIMIT 1');
    if (rows && rows.length > 0) {
      const s = rows[0];
      let parsed = {};
      if (s.invoice_settings) {
        try {
          parsed = typeof s.invoice_settings === 'string' ? JSON.parse(s.invoice_settings) : s.invoice_settings;
        } catch (e) {
          parsed = {};
        }
      }
      return {
        company_name: parsed.company_name || s.website_name || 'Roja Traders',
        invoice_title: parsed.invoice_title || 'ORDER INVOICE / ESTIMATE BILL',
        invoice_prefix: parsed.invoice_prefix || 'RT-INV-',
        tagline: parsed.tagline || 'Wholesale & Retail Provisions',
        address: parsed.address || s.address || 'Avinash, Tamil Nadu, India',
        contact_number: parsed.contact_number || s.contact_number || '+91 9597993402',
        email: parsed.email || s.email || 'sudhasunt2006@gmail.com',
        gstin: parsed.gstin || '',
        fssai: parsed.fssai || '',
        show_tamil_name: parsed.show_tamil_name !== false,
        tax_rate: parseFloat(parsed.tax_rate || 0),
        tax_label: parsed.tax_label || 'GST / Tax',
        upi_id: parsed.upi_id || '9597993402@upi',
        payment_qr_url: parsed.payment_qr_url || '',
        terms: parsed.terms || '1. Goods once sold will not be returned without bill.\n2. Please inspect all items upon receipt.\n3. Thank you for choosing Roja Traders!',
        footer_note: parsed.footer_note || 'Direct WhatsApp Order | Genuine Stock Guaranteed'
      };
    }
  } catch (err) {
    console.error('Error fetching invoice settings:', err.message);
  }

  return {
    company_name: 'Roja Traders',
    invoice_title: 'ORDER INVOICE / ESTIMATE BILL',
    invoice_prefix: 'RT-INV-',
    tagline: 'Wholesale & Retail Provisions',
    address: 'Avinash, Tamil Nadu, India',
    contact_number: '+91 9597993402',
    email: 'sudhasunt2006@gmail.com',
    gstin: '',
    fssai: '',
    show_tamil_name: true,
    tax_rate: 0,
    tax_label: 'GST / Tax',
    upi_id: '9597993402@upi',
    payment_qr_url: '',
    terms: '1. Goods once sold will not be returned without bill.\n2. Please inspect all items upon receipt.\n3. Thank you for choosing Roja Traders!',
    footer_note: 'Direct WhatsApp Order | Genuine Stock Guaranteed'
  };
}

/**
 * Generate clean text WhatsApp order message (NO images, NO emojis)
 * Contains ONLY: customer name, item name, quantity, price, total amount
 */
function generateWhatsAppInvoice({
  customerName,
  items,
  totalAmount
}) {
  let msg = `Customer Name: ${customerName || 'Customer'}\n\n`;

  (items || []).forEach((item) => {
    const itemName = item.product_name || item.name || 'Product';
    const qty = parseInt(item.quantity || 1, 10);
    const unitPrice = parseFloat(item.price || item.unit_price || 0);

    msg += `Item Name: ${itemName}\n`;
    msg += `Quantity: ${qty}\n`;
    msg += `Price: Rs. ${unitPrice.toFixed(0)}\n\n`;
  });

  const grandTotal = parseFloat(totalAmount || 0);
  msg += `Total Amount: Rs. ${grandTotal.toFixed(0)}`;

  return msg;
}

/**
 * Backward compatibility wrapper
 */
function generateWhatsAppMessage(params) {
  return generateWhatsAppInvoice(params);
}

/**
 * Build WhatsApp click-to-chat URL
 */
function buildWhatsAppUrl(phoneNumber, messageText) {
  const cleanNumber = cleanWhatsAppNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(messageText);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

module.exports = {
  cleanWhatsAppNumber,
  getAdminWhatsAppNumber,
  getInvoiceSettingsFromDB,
  generateWhatsAppInvoice,
  generateWhatsAppMessage,
  buildWhatsAppUrl
};
