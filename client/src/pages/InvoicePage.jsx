import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  Share2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  Download,
  Image as ImageIcon,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import api from '../services/api';
import RoyalLogo from '../components/RoyalLogo';

// Helper to convert number to words (Indian numbering system)
function numberToWordsINR(amount) {
  const num = Math.floor(Math.abs(Number(amount) || 0));
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;
  const hundred = Math.floor(remainder / 100);
  const tens = remainder % 100;

  if (crore > 0) words += inWords(crore) + ' Crore ';
  if (lakh > 0) words += inWords(lakh) + ' Lakh ';
  if (thousand > 0) words += inWords(thousand) + ' Thousand ';
  if (hundred > 0) words += inWords(hundred) + ' Hundred ';
  if (tens > 0) words += (words !== '' ? 'and ' : '') + inWords(tens) + ' ';

  return (words.trim() + ' Rupees Only');
}

export default function InvoicePage() {
  const { invoiceNumber } = useParams();
  const invoiceCardRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await api.get(`/invoices/${invoiceNumber}`);
        if (res.data?.data) {
          setData(res.data.data);
        } else if (res.data?.invoice) {
          setData(res.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Invoice could not be found.');
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceNumber]);

  const handlePrint = () => {
    window.print();
  };

  /**
   * Download the bill as a high-resolution PNG image
   */
  const handleDownloadImage = async () => {
    if (!invoiceCardRef.current) return;
    setIsProcessingImage(true);
    try {
      const dataUrl = await toPng(invoiceCardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `Roja_Traders_Bill_${invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
      // Fallback: open direct server image
      window.open(`/api/invoices/${invoiceNumber}/image`, '_blank');
    } finally {
      setIsProcessingImage(false);
    }
  };

  /**
   * Share the Bill Image directly to WhatsApp or copy to clipboard
   */
  const handleShareImageWhatsApp = async () => {
    if (!invoiceCardRef.current || !data?.invoice) return;
    setIsProcessingImage(true);
    try {
      const blob = await toBlob(invoiceCardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });

      if (!blob) throw new Error('Could not create image blob');

      const fileName = `Roja_Traders_Bill_${invoiceNumber}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 1. Mobile Web Share API (sends actual image into WhatsApp)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Roja Traders Order Bill #${invoiceNumber}`,
          text: `Official Bill for Order #${invoiceNumber} from Roja Traders.`
        });
        setIsProcessingImage(false);
        return;
      }

      // 2. Desktop Fallback: Copy image to clipboard so user can press Ctrl+V in WhatsApp Web
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 5000);
      } catch (clipboardErr) {
        console.warn('Clipboard write failed:', clipboardErr);
      }

      // Also trigger a download so they have the file ready to attach
      const link = document.createElement('a');
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();

      // Clean WhatsApp order text (NO emoji, NO image, only item name, quantity, price, total, customer name)
      const cleanNumber = (data.invoice.customer_mobile || '919597993402').replace(/[^0-9]/g, '');
      let itemLines = '';
      (data.items || []).forEach(it => {
        itemLines += `Item Name: ${it.product_name}\nQuantity: ${it.quantity}\nPrice: Rs. ${parseFloat(it.unit_price).toFixed(0)}\n\n`;
      });
      const text = encodeURIComponent(
        `Customer Name: ${data.invoice.customer_name || 'Customer'}\n\n` +
        itemLines +
        `Total Amount: Rs. ${parseFloat(data.invoice.total_amount).toFixed(0)}`
      );
      window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
    } catch (err) {
      console.error('Share failed:', err);
      // Fallback
      window.open(`/api/invoices/${invoiceNumber}/image`, '_blank');
    } finally {
      setIsProcessingImage(false);
    }
  };

  /**
   * Copy bill image to clipboard
   */
  const handleCopyImage = async () => {
    if (!invoiceCardRef.current) return;
    setIsProcessingImage(true);
    try {
      const blob = await toBlob(invoiceCardRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to copy image:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Generating Official Invoice Bill...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !data?.invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invoice Not Found</h2>
          <p className="text-xs text-slate-500">
            {errorMsg || 'The requested invoice number is invalid or has been archived.'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, settings } = data;
  const items = invoice.items || [];
  const taxRate = parseFloat(settings.tax_rate || 0);
  const taxAmount = taxRate > 0 ? (invoice.total_amount * taxRate) / 100 : 0;
  const grandTotal = invoice.total_amount + taxAmount;

  const invoiceDate = new Date(invoice.created_at || Date.now());
  const dateFormatted = invoiceDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeFormatted = invoiceDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4 sm:px-6">
      {/* Top Action Bar (Hidden during window.print) */}
      <div className="max-w-4xl mx-auto mb-6 space-y-3 print:hidden">
        {copySuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Bill Image successfully copied to your clipboard! You can now press <strong>Ctrl + V</strong> in WhatsApp Web to paste the image directly.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Share Image to WhatsApp */}
            <button
              onClick={handleShareImageWhatsApp}
              disabled={isProcessingImage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Share bill image on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>{isProcessingImage ? 'Generating Image...' : 'Send Bill Image (WhatsApp)'}</span>
            </button>

            {/* 2. Download Image PNG */}
            <button
              onClick={handleDownloadImage}
              disabled={isProcessingImage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Download image format bill (PNG)"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Download Image (PNG)</span>
            </button>

            {/* 3. Copy Image to Clipboard */}
            <button
              onClick={handleCopyImage}
              disabled={isProcessingImage}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Copy bill image to paste in WhatsApp"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Image</span>
            </button>

            {/* 4. Print / PDF */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Print or Save PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable / Capturable Invoice Card */}
      <div
        ref={invoiceCardRef}
        id="invoice-printable-card"
        className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <RoyalLogo className="w-14 h-14 rounded-2xl shadow-xs" />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {settings.company_name || 'Roja Traders'}
              </h1>
              {settings.tagline && (
                <p className="text-xs text-emerald-700 font-semibold tracking-wide">
                  {settings.tagline}
                </p>
              )}
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-relaxed">
                {settings.address || 'Avinash, Tamil Nadu, India'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-1">
                {settings.contact_number && (
                  <span>Phone: <strong className="text-slate-800">{settings.contact_number}</strong></span>
                )}
                {settings.email && (
                  <span>Email: <strong className="text-slate-800">{settings.email}</strong></span>
                )}
              </div>
              {settings.gstin && (
                <p className="text-[11px] text-slate-700 font-mono mt-0.5">
                  GSTIN: <strong className="text-slate-900">{settings.gstin}</strong>
                </p>
              )}
              {settings.fssai && (
                <p className="text-[11px] text-slate-700 font-mono">
                  FSSAI No: <strong className="text-slate-900">{settings.fssai}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-200/60 mb-2">
              {settings.invoice_title || 'ORDER INVOICE / ESTIMATE BILL'}
            </span>
            <div className="space-y-1 text-xs">
              <p className="font-mono text-sm font-extrabold text-slate-900">
                {invoice.invoice_number || `RT-INV-${invoice.id}`}
              </p>
              <p className="text-slate-500">
                Date: <strong className="text-slate-700">{dateFormatted}</strong>
              </p>
              <p className="text-slate-500">
                Time: <strong className="text-slate-700">{timeFormatted}</strong>
              </p>
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  invoice.enquiry_status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.enquiry_status === 'contacted'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Status: {invoice.enquiry_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Bill-To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed To (Customer):
            </span>
            <p className="text-sm font-black text-slate-900">{invoice.customer_name || 'Valued Customer'}</p>
            <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5">
              Phone: {invoice.customer_mobile || 'N/A'}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Order Reference & Mode:
              </span>
              <p className="text-xs font-semibold text-slate-700">
                Direct WhatsApp Verified Order
              </p>
            </div>
            {settings.upi_id && (
              <p className="text-[11px] text-slate-600 mt-2 font-mono">
                Payment UPI: <strong className="text-emerald-800">{settings.upi_id}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                <th className="py-2.5 px-2 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-center w-20">Qty</th>
                <th className="py-2.5 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    {settings.show_tamil_name !== false && item.tamil_name && (
                      <p className="text-[11px] font-medium text-emerald-800 mt-0.5">
                        {item.tamil_name}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    ₹{parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                    ₹{parseFloat(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations / Summary */}
        <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          <div className="sm:col-span-7 space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs text-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Amount in Words:
              </span>
              <p className="font-bold text-slate-900 italic">
                {numberToWordsINR(grandTotal)}
              </p>
            </div>

            {/* Terms & Conditions */}
            {settings.terms && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Terms & Conditions:
                </span>
                <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                  {settings.terms}
                </p>
              </div>
            )}
          </div>

          <div className="sm:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Quantity:</span>
              <span className="font-bold font-mono text-slate-900">{invoice.total_quantity} pcs</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-bold font-mono text-slate-900">₹{invoice.total_amount.toFixed(2)}</span>
            </div>

            {taxRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>{settings.tax_label || 'GST / Tax'} ({taxRate}%):</span>
                <span className="font-bold font-mono text-slate-900">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge:</span>
              <span className="font-semibold text-emerald-700">Free / Standard</span>
            </div>

            <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-300 text-sm font-black text-slate-900">
              <span>Grand Total:</span>
              <span className="text-base text-emerald-800 font-mono">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signatory & Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left text-[11px] text-slate-400">
            <p className="font-medium text-slate-600">{settings.footer_note || 'Thank you for choosing Roja Traders!'}</p>
            <p>This is a computer-generated order bill.</p>
          </div>

          <div className="text-center sm:text-right">
            <div className="h-10" />
            <div className="border-t border-slate-400 pt-1 w-44">
              <p className="text-[11px] font-bold text-slate-900">For {settings.company_name || 'Roja Traders'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
