import React, { useState } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Sparkles,
  ShieldCheck,
  PackageCheck,
  BadgeCheck
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import RoyalLogo from '../components/RoyalLogo';

export default function ContactPage() {
  const { settings, whatsappNumber } = useSettings();

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [message, setMessage] = useState('');

  const cleanWhatsAppNumber = (whatsappNumber || '919597993402').replace(/[^0-9]/g, '');
  const displayPhone = settings.contact_number || '9597993402';
  const displayEmail = settings.email || 'contact@showcase.com';
  const displayAddress = settings.address || 'Chennai, Tamil Nadu, India';

  const handleOpenWhatsAppChat = () => {
    const text = encodeURIComponent(
      `Hello ${settings.website_name || 'Roja Traders'}! I am reaching out to enquire about your products and services.`
    );
    window.open(`https://wa.me/${cleanWhatsAppNumber}?text=${text}`, '_blank');
  };

  const handleDirectEnquirySubmit = (e) => {
    e.preventDefault();
    let text = `*New Customer Enquiry via Website*\n\n`;
    if (customerName.trim()) text += `*Name:* ${customerName.trim()}\n`;
    if (customerMobile.trim()) text += `*Phone:* ${customerMobile.trim()}\n`;
    text += `*Message:* ${message.trim() || 'Hello! I would like to get in touch with you.'}\n\n`;
    text += `Sent from ${settings.website_name || 'Roja Traders'} contact page.`;

    window.open(`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-12">
      {/* 1. Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>We're Here to Help</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Get In Touch with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
            {settings.website_name || 'Roja Traders'}
          </span>
        </h1>

        <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
          Have questions about our salt products, rangoli powders, cleaning essentials, or vermicelli? Need wholesale bulk quotes or order assistance? Speak directly with our team on WhatsApp or phone!
        </p>
      </div>

      {/* 2. Key Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Official WhatsApp */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 fill-white stroke-none" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Instant Chat & Orders
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">Official WhatsApp</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Connect in 1 tap for order status, custom pricing, bulk orders, and product availability.
              </p>
            </div>
            <p className="font-mono text-sm font-bold text-gray-900">+{cleanWhatsAppNumber}</p>
          </div>

          <button
            onClick={handleOpenWhatsAppChat}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20be5b] text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white stroke-none" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>

        {/* Card 2: Phone Hotline */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Direct Calling Hotline
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">Phone Call</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Call our support desk directly during working hours for quick enquiries and order follow-ups.
              </p>
            </div>
            <p className="font-mono text-sm font-bold text-gray-900">+91 {displayPhone}</p>
          </div>

          <a
            href={`tel:+91${displayPhone.replace(/[^0-9]/g, '')}`}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-gray-900 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 text-center"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call +91 {displayPhone}</span>
          </a>
        </div>

        {/* Card 3: Location & Hours */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 hover:border-emerald-200 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                Store Location & Hours
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-1">Office & Storefront</h3>
              <p className="text-xs text-gray-700 font-medium mt-1 leading-relaxed">
                {displayAddress}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pt-1">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Monday – Saturday: 8:00 AM – 9:00 PM</span>
            </div>
          </div>

          <div className="mt-6 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
            <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Fast Tamil Nadu Delivery</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Send Quick Enquiry Form & Brand Guarantee */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Direct Message to WhatsApp */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Send an Enquiry
            </span>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
              Have a Custom Request or Bulk Requirement?
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill out this quick note and click send. It will launch WhatsApp with your message formatted and ready to deliver.
            </p>
          </div>

          <form onSubmit={handleDirectEnquirySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Your Message / Products Interested In *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Mention product names, quantities, or specific questions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Message to WhatsApp</span>
            </button>
          </form>
        </div>

        {/* Right Info Box: Trust & Direct Commerce Guarantees */}
        <div className="lg:col-span-5 bg-gradient-to-b from-gray-900 to-gray-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <RoyalLogo className="w-12 h-12" />
            <div>
              <h3 className="text-lg font-bold text-white">{settings.website_name || 'Roja Traders'}</h3>
              <p className="text-xs text-emerald-400 font-medium">Quality Grocery & Essentials</p>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            We are dedicated to supplying authentic household provisions, salt varieties, traditional fryums, and cleaning essentials directly to families and businesses across Tamil Nadu.
          </p>

          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Human Interaction</h4>
                <p className="text-[11px] text-gray-400">Speak directly with real people for sizing, bulk pricing, and custom requirements.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-teal-400 shrink-0">
                <PackageCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Zero Payment Gateway Barriers</h4>
                <p className="text-[11px] text-gray-400">Review products in your cart, tap to submit, and finalize payment and shipping via WhatsApp.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-emerald-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Prompt Order Processing</h4>
                <p className="text-[11px] text-gray-400">Orders placed on WhatsApp are processed quickly for local dispatch.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
