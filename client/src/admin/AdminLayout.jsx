import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  MessageSquare,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Store,
  Menu,
  X,
  Bell,
  KeyRound,
  Receipt,
  Sparkles,
  Code2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import RoyalLogo from '../components/RoyalLogo';
import DeveloperModal from '../components/DeveloperModal';

export default function AdminLayout() {
  const { adminUser, adminLogout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [onlineCustomers, setOnlineCustomers] = useState(1);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  // Poll live online customer count
  useEffect(() => {
    const fetchOnline = () => {
      api.get('/admin/live-visitors')
        .then((res) => {
          if (res.data?.onlineCustomers !== undefined) {
            setOnlineCustomers(res.data.onlineCustomers);
          }
        })
        .catch(() => {});
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Stock Manager', path: '/admin/stock', icon: Boxes },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    { label: 'Offer Posters', path: '/admin/banners', icon: Sparkles },
    { label: 'Invoice & Bills', path: '/admin/invoice-settings', icon: Receipt },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Website Settings', path: '/admin/settings', icon: Settings },
    { label: 'Security & Profile', path: '/admin/profile', icon: KeyRound }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <header className="md:hidden bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
            R
          </div>
          <span className="font-bold text-sm tracking-tight">{settings.website_name || 'Admin'}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Online Customer Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-full text-[10px] font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{onlineCustomers} Online</span>
          </div>

          <Link
            to="/"
            target="_blank"
            className="p-2 text-gray-400 hover:text-white"
            title="View Live Store"
          >
            <Store className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 flex flex-col justify-between border-r border-gray-800 transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:relative'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <RoyalLogo className="w-10 h-10" />
              <div>
                <span className="font-extrabold text-white text-base tracking-tight block">
                  Roja Traders
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                  Admin Console
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'hover:bg-gray-800/80 hover:text-white text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-colors"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Visit Live Store</span>
          </Link>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                {adminUser?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{adminUser?.username}</p>
                <p className="text-[10px] text-gray-500 capitalize">{adminUser?.role || 'Admin'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Developer Attribution Button */}
          <div className="pt-2 border-t border-gray-800/80">
            <button
              onClick={() => setIsDevModalOpen(true)}
              className="flex items-center gap-2.5 w-full p-2 rounded-xl bg-gray-950/60 hover:bg-gray-800 border border-gray-800/80 hover:border-emerald-500/50 text-left transition-all cursor-pointer group shadow-xs"
              title="Click to view Developer & Architecture Profile"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-emerald-500/40 bg-emerald-950/80 text-emerald-400 shrink-0">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 group-hover:text-emerald-400 transition-colors">Developed & Architecture by</p>
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300">Sudhasun</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Page Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-4 shadow-xs sticky top-0 z-20">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Management Portal
            </span>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Customer Online Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-xs font-bold shadow-2xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{onlineCustomers} Customer Online</span>
            </div>

            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Customer Storefront</span>
            </Link>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Logged in as <strong>{adminUser?.username}</strong></span>
            </div>
          </div>
        </div>

        {/* Content Outlet */}
        <div className="p-4 sm:p-8 flex-1">
          <Outlet />
        </div>

        {/* Admin Footer with Developer Credit */}
        <footer className="border-t border-gray-200/80 bg-white/70 backdrop-blur-xs py-3.5 px-4 sm:px-8 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto">
          <span className="text-[11px] text-gray-400">© 2026 Roja Traders Admin Management Portal</span>
          
          <button
            onClick={() => setIsDevModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 hover:bg-white border border-gray-200 hover:border-emerald-500/50 text-gray-600 hover:text-gray-900 transition-all cursor-pointer group shadow-2xs"
            title="Click to view Developer & Architecture details"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center border border-emerald-500/40 bg-emerald-50 text-emerald-700 shrink-0">
              <Code2 className="w-3 h-3" />
            </div>
            <span className="text-[11px]">
              Developed & Architecture by <strong className="text-emerald-700 font-bold group-hover:underline decoration-dotted underline-offset-2">Sudhasun</strong>
            </span>
          </button>
        </footer>
      </main>

      {/* Developer Profile Modal */}
      <DeveloperModal isOpen={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} />
    </div>
  );
}
