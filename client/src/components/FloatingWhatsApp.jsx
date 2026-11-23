import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function FloatingWhatsApp() {
  const { whatsappNumber, websiteName } = useSettings();

  const handleOpenWhatsApp = () => {
    const cleanNumber = (whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
    const defaultText = encodeURIComponent(
      `Hello! I am browsing ${websiteName || 'your store'} and would like to ask some questions regarding your products.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${defaultText}`, '_blank');
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 group flex items-center gap-3">
      {/* Label appears ONLY on hover */}
      <div className="hidden sm:flex pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out items-center bg-white py-1.5 px-3.5 rounded-full shadow-xl border border-emerald-200 text-xs font-bold text-gray-800 whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0 animate-ping" />
        Chat with us on WhatsApp
      </div>
      <button
        onClick={handleOpenWhatsApp}
        aria-label="Chat with us on WhatsApp"
        className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 cursor-pointer"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25 group-hover:opacity-40" />
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white stroke-none relative z-10" />
      </button>
    </div>
  );
}
