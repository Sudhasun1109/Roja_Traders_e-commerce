import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  Eye,
  Sliders,
  Sparkles,
  Printer,
  HelpCircle,
  Building2,
  Receipt,
  QrCode
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import RoyalLogo from '../components/RoyalLogo';

export default function InvoiceSettings() {
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/admin/invoice-settings');
        if (res.data?.settings) {
          setFormData((prev) => ({
            ...prev,
            ...res.data.settings
          }));
        }
      } catch (err) {
        error(err.message || 'Failed to load invoice settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      error('Company Name is required');
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/invoice-settings', formData);
      success('Invoice format & template settings updated successfully!');
    } catch (err) {
      error(err.message || 'Failed to update invoice settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 font-semibold">
        Loading invoice configuration...
      </div>
    );
  }

  // Sample items for live preview
  const previewItems = [
    { name: 'Rice Sevai', tamil: 'அரிசி சேவை', rate: 45, qty: 2, amount: 90 },
    { name: 'Rock Salt – 1 KG', tamil: 'கல் உப்பு – 1 கிலோ', rate: 20, qty: 3, amount: 60 },
    { name: 'Onion Vadagam', tamil: 'வெங்காய வடகம்', rate: 55, qty: 1, amount: 55 }
  ];
  const previewSubtotal = 205;
  const previewTax = parseFloat(formData.tax_rate || 0) > 0
    ? (previewSubtotal * parseFloat(formData.tax_rate)) / 100
    : 0;
  const previewGrandTotal = previewSubtotal + previewTax;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-100">
            <Receipt className="w-3.5 h-3.5" />
            <span>Bill & Invoice Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Invoice Format & Template Editor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize the official bill layout, business header, tax rates, prefixes, and WhatsApp invoice format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="sm:hidden flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'editor' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'preview' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Live Preview
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Form Column */}
        <div className={`lg:col-span-6 space-y-6 ${activeTab === 'preview' ? 'hidden sm:block' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Header & Identity */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span>Store & Header Information</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Store Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                    placeholder="e.g. Roja Traders"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Invoice Title</label>
                    <input
                      type="text"
                      name="invoice_title"
                      value={formData.invoice_title}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                      placeholder="e.g. ORDER INVOICE / ESTIMATE BILL"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
                    <input
                      type="text"
                      name="invoice_prefix"
                      value={formData.invoice_prefix}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono font-medium"
                      placeholder="e.g. RT-INV-"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline / Subheading</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                    placeholder="e.g. Wholesale & Retail Provisions"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                    placeholder="e.g. Avinash, Tamil Nadu, India"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                      placeholder="+91 9597993402"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                      placeholder="sudhasunt2006@gmail.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tax & Legal Numbers */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>Tax, GST & Registrations</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">FSSAI / License No (Optional)</label>
                    <input
                      type="text"
                      name="fssai"
                      value={formData.fssai}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                      placeholder="e.g. 10020042000123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="tax_rate"
                      value={formData.tax_rate}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                      placeholder="0 (Set > 0 to apply)"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Set 0 if products are tax-inclusive or tax-exempt</span>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax Label</label>
                    <input
                      type="text"
                      name="tax_label"
                      value={formData.tax_label}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      placeholder="GST / Tax"
                    />
                  </div>
                </div>

                {/* Show Tamil Name Toggle */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 cursor-pointer">
                    <input
                      type="checkbox"
                      name="show_tamil_name"
                      checked={formData.show_tamil_name}
                      onChange={handleChange}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Include Tamil Product Names on Bill
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Prints the secondary Tamil product name beneath each item row on WhatsApp bills and web printouts.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Payment & Terms */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>Payment & Terms of Sale</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI / Payment Handle (Optional)</label>
                  <input
                    type="text"
                    name="upi_id"
                    value={formData.upi_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                    placeholder="e.g. 9597993402@upi / GPay"
                  />
                </div>

                {/* Editable Payment QR Code field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Payment QR Code (Editable Image / URL)</span>
                    </label>
                    {formData.upi_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const autoQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${formData.upi_id}&pn=${formData.company_name || 'Roja Traders'}&cu=INR`)}`;
                          setFormData(prev => ({ ...prev, payment_qr_url: autoQr }));
                        }}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        ⚡ Generate QR from UPI
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    name="payment_qr_url"
                    value={formData.payment_qr_url || ''}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                    placeholder="Enter custom QR image URL or click 'Generate QR from UPI'"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Upload or enter your GPay / PhonePe / Paytm QR image URL. This QR code will appear directly on customer invoices.
                  </span>

                  {/* Live QR Preview in Form */}
                  {(formData.payment_qr_url || formData.upi_id) && (
                    <div className="mt-2.5 p-3 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl flex items-center gap-3">
                      <img
                        src={formData.payment_qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${formData.upi_id}&pn=${formData.company_name || 'Roja Traders'}&cu=INR`)}`}
                        alt="Payment QR"
                        className="w-16 h-16 rounded-xl border border-emerald-300 bg-white object-contain p-1 shrink-0 shadow-2xs"
                      />
                      <div className="text-[11px] leading-tight">
                        <p className="font-bold text-slate-900">Payment QR Code Active</p>
                        <p className="text-slate-500 font-mono mt-0.5">{formData.upi_id || 'UPI Payment'}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Displayed on digital bill</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Terms & Conditions</label>
                  <textarea
                    rows={4}
                    name="terms"
                    value={formData.terms}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none font-sans leading-relaxed"
                    placeholder="Enter conditions line by line..."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Footer Note</label>
                  <input
                    type="text"
                    name="footer_note"
                    value={formData.footer_note}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    placeholder="e.g. Direct WhatsApp Order | Genuine Stock Guaranteed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Updating Template...' : 'Save Invoice Configuration'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className={`lg:col-span-6 sticky top-24 ${activeTab === 'editor' ? 'hidden sm:block' : ''}`}>
          <div className="bg-white rounded-3xl border-2 border-emerald-700/30 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Eye className="w-4 h-4 text-emerald-700" />
                <span>Live Interactive Invoice Preview</span>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Auto-Updating
              </span>
            </div>

            {/* Simulated Bill View */}
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <RoyalLogo className="w-10 h-10 rounded-xl" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {formData.company_name || 'Roja Traders'}
                    </h3>
                    {formData.tagline && (
                      <p className="text-[11px] text-emerald-700 font-semibold">{formData.tagline}</p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5">{formData.address}</p>
                    <p className="text-[10px] text-slate-500">Phone: {formData.contact_number}</p>
                    {formData.gstin && (
                      <p className="text-[10px] font-mono text-slate-700">GSTIN: {formData.gstin}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200 mb-1">
                    {formData.invoice_title || 'ORDER INVOICE / BILL'}
                  </span>
                  <p className="text-xs font-mono font-extrabold text-slate-900">
                    {formData.invoice_prefix || 'RT-INV-'}2026-0042
                  </p>
                  <p className="text-[10px] text-slate-400">Date: 12-Nov-2026</p>
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Billed To:
                </span>
                <p className="font-bold text-slate-900">Sudha Sun</p>
                <p className="text-[11px] font-mono text-emerald-800">+91 9597993402</p>
              </div>

              {/* Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-extrabold uppercase text-slate-600">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-center w-12">Qty</th>
                    <th className="py-2 text-right w-16">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {formData.show_tamil_name && (
                          <p className="text-[10px] text-emerald-700">{item.tamil}</p>
                        )}
                      </td>
                      <td className="py-2 text-right font-mono text-slate-600">₹{item.rate}</td>
                      <td className="py-2 text-center font-mono font-bold text-slate-900">{item.qty}</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-900">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 border-t border-slate-300 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold font-mono">₹{previewSubtotal.toFixed(2)}</span>
                </div>

                {parseFloat(formData.tax_rate || 0) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{formData.tax_label || 'GST'} ({formData.tax_rate}%):</span>
                    <span className="font-bold font-mono">₹{previewTax.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery:</span>
                  <span className="font-semibold text-emerald-700">Free / Standard</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-base text-emerald-800 font-mono">₹{previewGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment QR & Details in Preview */}
              {(formData.payment_qr_url || formData.upi_id) && (
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Scan & Pay (UPI):
                    </span>
                    <p className="font-mono text-xs font-bold text-emerald-800">{formData.upi_id || 'UPI Payment'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">GPay / PhonePe / Paytm / Any UPI</p>
                  </div>
                  <img
                    src={formData.payment_qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${formData.upi_id}&pn=${formData.company_name || 'Roja Traders'}&cu=INR`)}`}
                    alt="Payment QR Code"
                    className="w-14 h-14 rounded-lg border border-emerald-300 bg-white object-contain p-1 shrink-0"
                  />
                </div>
              )}

              {formData.terms && (
                <div className="text-[10px] text-slate-500 whitespace-pre-line border-t border-slate-100 pt-2 leading-relaxed">
                  <strong>Terms:</strong> {formData.terms}
                </div>
              )}

              <div className="text-[10px] text-center text-slate-400 pt-2 border-t border-slate-100">
                {formData.footer_note}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
