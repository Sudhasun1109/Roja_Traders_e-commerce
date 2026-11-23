import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Receipt, MessageCircle, LogOut, Smartphone, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RoyalLogo from '../components/RoyalLogo';

export default function CustomerProfilePage() {
  const { isCustomerLoggedIn, customerUser, customerLogout } = useAuth();
  const navigate = useNavigate();

  if (!isCustomerLoggedIn) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    customerLogout();
    navigate('/');
  };

  const handleTriggerInstall = () => {
    window.dispatchEvent(new CustomEvent('trigger-install-app'));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-10 pb-24 md:pb-12 space-y-5">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#06241a] via-[#0b3324] to-[#04160f] p-1 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-sm">
          <div className="w-full h-full rounded-xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black">
            {customerUser?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-slate-900 truncate">
              {customerUser?.name}
            </h2>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {customerUser?.mobile_number}
          </p>
          <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Verified Customer
          </span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
        <Link
          to="/orders"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">My Orders</p>
              <p className="text-[11px] text-slate-400">View past WhatsApp orders and digital bills</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <button
          type="button"
          onClick={handleTriggerInstall}
          className="w-full text-left flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Install App</p>
              <p className="text-[11px] text-slate-400">Add to home screen for 1-click fast shopping</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <Link
          to="/contact"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Contact & Support</p>
              <p className="text-[11px] text-slate-400">Direct WhatsApp support & store location</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-rose-200/60"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Account</span>
      </button>

      {/* Footer Branding */}
      <div className="text-center pt-4">
        <p className="text-[11px] text-slate-400 font-medium">
          Roja Traders Mobile App • Version 2.0 PWA
        </p>
      </div>
    </div>
  );
}
