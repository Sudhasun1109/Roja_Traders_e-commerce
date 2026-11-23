const pool = require('../config/db');
const { getInvoiceSettingsFromDB } = require('./whatsappService');

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a standalone visual SVG Receipt / Bill Image
 */
function generateInvoiceSVG(invoice, settings) {
  const items = invoice.items || [];
  const baseHeight = 520;
  const rowHeight = settings.show_tamil_name !== false ? 44 : 32;
  const itemsHeight = items.length * rowHeight;
  const totalHeight = Math.max(750, baseHeight + itemsHeight);

  const dateObj = new Date(invoice.created_at || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const taxRate = parseFloat(settings.tax_rate || 0);
  const taxAmount = taxRate > 0 ? (invoice.total_amount * taxRate) / 100 : 0;
  const grandTotal = invoice.total_amount + taxAmount;

  // Render items rows
  let yPos = 310;
  let itemsSvg = '';
  items.forEach((item, index) => {
    const engName = escapeXml(item.product_name);
    const tamName = escapeXml(item.tamil_name);
    const rate = `₹${parseFloat(item.unit_price).toFixed(2)}`;
    const qty = String(item.quantity);
    const total = `₹${parseFloat(item.subtotal).toFixed(2)}`;

    itemsSvg += `
      <g transform="translate(0, ${yPos})">
        <text x="35" y="16" font-family="'Segoe UI', -apple-system, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">${index + 1}</text>
        <text x="65" y="16" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="700" fill="#0f172a">${engName}</text>
        ${settings.show_tamil_name !== false && tamName ? `
          <text x="65" y="32" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" fill="#047857">${tamName}</text>
        ` : ''}
        <text x="510" y="16" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" fill="#334155" text-anchor="end">${rate}</text>
        <text x="590" y="16" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="700" fill="#0f172a" text-anchor="middle">${qty}</text>
        <text x="735" y="16" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#0f172a" text-anchor="end">${total}</text>
        <line x1="30" y1="${rowHeight}" x2="740" y2="${rowHeight}" stroke="#f1f5f9" stroke-width="1" />
      </g>
    `;
    yPos += rowHeight;
  });

  const totalsY = yPos + 25;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="770" height="${totalHeight}" viewBox="0 0 770 ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="770" height="${totalHeight}" fill="#f8faf9" />

  <!-- Main Card -->
  <rect x="15" y="15" width="740" height="${totalHeight - 30}" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#shadow)" />

  <!-- Top Decorative Header Strip -->
  <path d="M 15 39 C 15 25.745 25.745 15 39 15 L 731 15 C 744.255 15 755 25.745 755 39 L 755 105 L 15 105 Z" fill="url(#headerGrad)" />

  <!-- Monogram Logo Badge -->
  <rect x="35" y="32" width="56" height="56" rx="16" fill="url(#goldGrad)" />
  <text x="63" y="68" font-family="'Segoe UI', -apple-system, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">RT</text>

  <!-- Store Name & Title in Header -->
  <text x="105" y="55" font-family="'Segoe UI', -apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">${escapeXml(settings.company_name || 'ROJA TRADERS')}</text>
  <text x="105" y="75" font-family="'Segoe UI', -apple-system, sans-serif" font-size="12" font-weight="600" fill="#34d399">${escapeXml(settings.tagline || 'Wholesale &amp; Retail Provisions')}</text>

  <!-- Title Badge Top-Right -->
  <rect x="525" y="42" width="215" height="34" rx="17" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.25" />
  <text x="632" y="64" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${escapeXml(settings.invoice_title || 'OFFICIAL ORDER BILL')}</text>

  <!-- Store Address & Contact Row -->
  <text x="35" y="130" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" fill="#64748b">${escapeXml(settings.address)} | Phone: ${escapeXml(settings.contact_number)} | Email: ${escapeXml(settings.email)}</text>
  ${settings.gstin ? `<text x="35" y="146" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="700" fill="#334155">GSTIN: ${escapeXml(settings.gstin)}</text>` : ''}

  <!-- Order & Customer Info Grid -->
  <rect x="30" y="160" width="710" height="85" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />

  <text x="45" y="183" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" font-weight="800" fill="#94a3b8" letter-spacing="1">INVOICE NUMBER</text>
  <text x="45" y="205" font-family="'Segoe UI', -apple-system, sans-serif" font-size="16" font-weight="900" fill="#065f46">${escapeXml(invoice.invoice_number)}</text>
  <text x="45" y="225" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" fill="#64748b">${dateStr}, ${timeStr}</text>

  <line x1="280" y1="170" x2="280" y2="235" stroke="#e2e8f0" stroke-width="1" />

  <text x="300" y="183" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" font-weight="800" fill="#94a3b8" letter-spacing="1">BILLED TO (CUSTOMER)</text>
  <text x="300" y="205" font-family="'Segoe UI', -apple-system, sans-serif" font-size="15" font-weight="800" fill="#0f172a">${escapeXml(invoice.customer_name)}</text>
  <text x="300" y="225" font-family="'Segoe UI', -apple-system, sans-serif" font-size="12" font-weight="700" fill="#047857">${escapeXml(invoice.customer_mobile)}</text>

  <line x1="530" y1="170" x2="530" y2="235" stroke="#e2e8f0" stroke-width="1" />

  <text x="550" y="183" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" font-weight="800" fill="#94a3b8" letter-spacing="1">ORDER STATUS</text>
  <rect x="550" y="195" width="120" height="26" rx="13" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1" />
  <text x="610" y="212" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#065f46" text-anchor="middle">VERIFIED BILL</text>

  <!-- Items Table Header -->
  <rect x="30" y="265" width="710" height="34" rx="8" fill="#0f172a" />
  <text x="45" y="287" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff">#</text>
  <text x="75" y="287" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff">ITEM DESCRIPTION</text>
  <text x="510" y="287" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="end">RATE</text>
  <text x="590" y="287" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle">QTY</text>
  <text x="725" y="287" font-family="'Segoe UI', -apple-system, sans-serif" font-size="11" font-weight="800" fill="#ffffff" text-anchor="end">AMOUNT</text>

  <!-- Item Rows -->
  ${itemsSvg}

  <!-- Summary Box Right -->
  <rect x="420" y="${totalsY}" width="320" height="120" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
  <text x="440" y="${totalsY + 28}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="12" fill="#64748b">Total Items:</text>
  <text x="720" y="${totalsY + 28}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="12" font-weight="700" fill="#0f172a" text-anchor="end">${invoice.total_quantity} pcs</text>

  <text x="440" y="${totalsY + 52}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="12" fill="#64748b">Subtotal:</text>
  <text x="720" y="${totalsY + 52}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="700" fill="#0f172a" text-anchor="end">₹${invoice.total_amount.toFixed(2)}</text>

  <line x1="440" y1="${totalsY + 68}" x2="720" y2="${totalsY + 68}" stroke="#cbd5e1" stroke-width="1" />

  <text x="440" y="${totalsY + 98}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="14" font-weight="900" fill="#0f172a">GRAND TOTAL:</text>
  <text x="720" y="${totalsY + 98}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="18" font-weight="900" fill="#047857" text-anchor="end">₹${grandTotal.toFixed(2)}</text>

  <!-- Left Payment & Notes Box -->
  <rect x="30" y="${totalsY}" width="370" height="120" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
  ${settings.upi_id ? `
    <text x="45" y="${totalsY + 25}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" font-weight="800" fill="#94a3b8" letter-spacing="1">PAYMENT UPI / GPAY</text>
    <text x="45" y="${totalsY + 45}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="13" font-weight="800" fill="#047857">${escapeXml(settings.upi_id)}</text>
  ` : ''}
  <text x="45" y="${totalsY + 75}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" fill="#64748b">Verified Direct WhatsApp Order</text>
  <text x="45" y="${totalsY + 92}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" fill="#64748b">${escapeXml(settings.footer_note || 'Thank you for choosing Roja Traders!')}</text>

  <!-- Bottom Stamp & Barcode Decoration -->
  <line x1="30" y1="${totalHeight - 55}" x2="740" y2="${totalHeight - 55}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" />
  <text x="385" y="${totalHeight - 32}" font-family="'Segoe UI', -apple-system, sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle" letter-spacing="2">ROJA TRADERS OFFICIAL DIGITAL INVOICE BILL • COMPUTER GENERATED</text>
</svg>
`;
}

module.exports = {
  generateInvoiceSVG
};
