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
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-10 border-t border-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RoyalLogo className="w-10 h-10 shadow-md rounded-2xl" />
              <div>
                <span className="text-xl font-black text-white tracking-tight block">
                  {settings.website_name || 'Roja Traders'}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold tracking-wider uppercase">
                  Wholesale & Retail Provisions
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              {settings.description ||
                'Quality grocery, household essentials, salt products, cleaning chemicals, rangoli powders, and vermicelli at honest prices.'}
            </p>
            <div className="pt-2">
              <button
                onClick={handleOpenWhatsApp}
                className="inline-flex items-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                <span>Chat on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
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
                  Contact Us & Direct Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Store Information
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{settings.address || 'Madurai / Chennai, Tamil Nadu, India'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.contact_number || '+91 98765 43210'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.email || 'support@rojatraders.com'}</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-400 font-semibold pt-1">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Verified Direct Business WhatsApp</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & Developer Credit */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>{settings.footer_text || '© 2026 Roja Traders. All rights reserved.'}</p>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsDevModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-white transition-all cursor-pointer group shadow-xs"
              title="Click to view Developer & Architecture Profile"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shrink-0">
                <Code2 className="w-3 h-3" />
              </div>
              <span className="text-[11px]">
                Developed & Architecture by <strong className="text-emerald-400 group-hover:underline decoration-dotted underline-offset-2">Sudhasun</strong>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Developer Profile Popup Modal */}
      <DeveloperModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
    </footer>
  );
}
