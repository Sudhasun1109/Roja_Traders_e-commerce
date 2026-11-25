import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, MapPin, ShieldCheck, Heart, Sparkles, Code2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import RoyalLogo from './RoyalLogo';
import DeveloperModal from './DeveloperModal';

export default function Footer() {
  const { settings, whatsappNumber } = useSettings();
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  const handleOpenWhatsApp = () => {
    const cleanNumber = (whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=Hello!%20I%20have%20an%20enquiry`, '_blank');
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-6 sm:pt-12 pb-24 sm:pb-10 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: Brand & WhatsApp Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <RoyalLogo className="w-8 h-8 sm:w-10 sm:h-10 shadow-md rounded-xl shrink-0" />
            <div>
              <span className="text-base sm:text-xl font-black text-white tracking-tight block leading-tight">
                {settings.website_name || 'Roja Traders'}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                Wholesale & Retail Provisions
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-400 leading-normal max-w-md hidden md:block">
            {settings.description ||
              'Quality grocery, household essentials, salt products, cleaning chemicals, rangoli powders, and vermicelli at honest prices.'}
          </p>

          <button
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>

        {/* Middle: 2-Column Grid on Mobile for compact height */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-8 py-4">
          {/* Quick links */}
          <div>
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white mb-2 sm:mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Quick Navigation
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <li>
                <Link to="/" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Home Showcase
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  All Products & Categories
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white mb-2 sm:mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Store Information
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="truncate">{settings.address || 'Avinash, Tamil Nadu, India'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{settings.contact_number || '+91 9597993402'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{settings.email || 'sudhasunt2006@gmail.com'}</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Verified WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & Developer Credit */}
        <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2.5">
          {/* Developer Credit Button prominently visible and easily clickable */}
          <div className="order-1 sm:order-2 flex flex-wrap items-center justify-center">
            <button
              onClick={() => setIsDevModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-slate-200 hover:text-white transition-all cursor-pointer group shadow-md active:scale-95"
              title="Click to view Developer & Architecture Profile"
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 shrink-0">
                <Code2 className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] font-medium">
                Developed & Architecture by <strong className="text-emerald-400 font-bold group-hover:underline decoration-dotted underline-offset-2">Sudhasun</strong>
              </span>
            </button>
          </div>

          <p className="order-2 sm:order-1 text-center sm:text-left text-slate-500 text-[10px] sm:text-xs">
            {settings.footer_text || '© 2026 Roja Traders. All rights reserved.'}
          </p>
        </div>
      </div>

      {/* Developer Profile Popup Modal */}
      <DeveloperModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
    </footer>
  );
}
