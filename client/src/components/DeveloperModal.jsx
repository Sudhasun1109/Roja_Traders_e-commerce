import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Linkedin,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Code2,
  Sparkles,
  Layers,
  Heart
} from 'lucide-react';

export default function DeveloperModal({ isOpen, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative h-28 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 overflow-hidden">
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966915_1px,transparent_1px),linear-gradient(to_bottom,#05966915_1px,transparent_1px)] bg-[size:16px_16px]" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          <div className="absolute bottom-3 left-32 sm:left-36 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Developer & System Architect</span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Profile Picture */}
          <div className="relative -mt-16 mb-4 flex items-end justify-between">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-100 ring-2 ring-emerald-500/30">
                <img
                  src="/developer.jpg"
                  alt="Sudhasun - Developer & Architecture Designer"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback to server static upload if needed
                    e.currentTarget.src = '/uploads/developer.jpg';
                  }}
                />
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active Developer" />
            </div>

            <div className="flex items-center gap-1.5 pb-1">
              <a
                href="https://www.linkedin.com/in/sudhasunt/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold transition-all shadow-sm"
              >
                <Linkedin className="w-3.5 h-3.5 fill-white" />
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            </div>
          </div>

          {/* Name & Role */}
          <div className="space-y-1 mb-5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Sudhasun</span>
              <span className="text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                Creator
              </span>
            </h2>
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Develop & Architecture Design</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Architect and developer of this modern WhatsApp E-Commerce Platform, Progressive Web App (PWA), and Real-time Management System.
            </p>
          </div>

          {/* Contact Details List */}
          <div className="space-y-2.5">
            {/* Phone & WhatsApp */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Phone / WhatsApp
                    </span>
                    <span className="text-xs font-black text-slate-800 font-mono">
                      +91 95979 93402
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy('9597993402', 'phone')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Copy phone number"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href="tel:9597993402"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    Call
                  </a>
                  <a
                    href="https://wa.me/919597993402?text=Hello%20Sudhasun!%20I%20visited%20your%20Roja%20Traders%20application."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#1fb858] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <MessageCircle className="w-3 h-3 fill-white stroke-none" />
                    <span>Chat</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Email Address
                    </span>
                    <a
                      href="mailto:sudhasunt2006@gmail.com"
                      className="text-xs font-black text-slate-800 hover:text-blue-700 font-mono truncate block"
                      title="sudhasunt2006@gmail.com"
                    >
                      sudhasunt2006@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy('sudhasunt2006@gmail.com', 'email')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Copy email address"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href="mailto:sudhasunt2006@gmail.com"
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    Email
                  </a>
                </div>
              </div>
            </div>

            {/* LinkedIn Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center shrink-0">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Professional Network
                    </span>
                    <a
                      href="https://www.linkedin.com/in/sudhasunt/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-[#0A66C2] hover:underline font-mono truncate block"
                    >
                      linkedin.com/in/sudhasunt
                    </a>
                  </div>
                </div>

                <a
                  href="https://www.linkedin.com/in/sudhasunt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                >
                  <span>Connect</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span>Crafted with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>for Roja Traders</span>
            </span>
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
