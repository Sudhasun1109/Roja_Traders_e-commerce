import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  Menu,
  X,
  Phone,
  MessageCircle,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Smartphone,
  Download,
  Receipt,
  ChevronRight,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';
import RoyalLogo from './RoyalLogo';

export default function Navbar() {
  const { isCustomerLoggedIn, customerUser, customerLogout, isAdminLoggedIn, adminUser } = useAuth();
  const isAdmin = isAdminLoggedIn || customerUser?.role === 'admin';
  const { openCart, cartTotalQuantity } = useCart();
  const { settings, whatsappNumber } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Instant Suggestions on typing even 1 letter
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/suggestions?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.data?.suggestions) {
          setSuggestions(res.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('Failed to fetch search suggestions:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(e.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Heartbeat to keep online customer status active on admin dashboard
  useEffect(() => {
    const sendHeartbeat = () => {
      api.post('/activity/heartbeat').catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSelectSuggestion = (prod) => {
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
    navigate(`/products/${prod.id}`);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleDirectWhatsAppChat = () => {
    const cleanNumber = (whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=Hello!%20I%20would%20like%20to%20enquire%20about%20your%20products`, '_blank');
  };

  const openDirectWhatsApp = handleDirectWhatsAppChat;

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    ...(isCustomerLoggedIn ? [{ label: 'My Orders', path: '/orders' }] : []),
    { label: 'Contact Us', path: '/contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Delivery Notice Bar for Customers */}
      <div className="bg-emerald-800 text-emerald-100 text-[11px] sm:text-xs py-1.5 px-3 text-center font-bold tracking-wide flex items-center justify-center gap-1.5 border-b border-emerald-900/40">
        <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>Delivery Exclusively to <strong className="text-white underline decoration-amber-400 font-extrabold">Tiruppur & Avinashi</strong> Only</span>
        <span className="hidden sm:inline text-emerald-300/80">• Quick WhatsApp Order & Fast Delivery</span>
      </div>

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-6">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-3 shrink-0 group min-w-0">
            {settings.logo_url && settings.logo_url !== '/logo-rt.svg' ? (
              <img
                src={settings.logo_url}
                alt={settings.website_name || 'Roja Traders'}
                className="w-7 h-7 sm:w-11 sm:h-11 object-contain rounded-xl shadow-xs shrink-0"
              />
            ) : (
              <RoyalLogo className="w-7 h-7 sm:w-11 sm:h-11 transition-transform group-hover:scale-105 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-xs sm:text-base md:text-xl font-black text-slate-900 tracking-tight block leading-tight group-hover:text-emerald-700 transition-colors truncate max-w-[95px] sm:max-w-none">
                {settings.website_name || 'Roja Traders'}
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-emerald-700 tracking-wider uppercase">
                Quality Everyday Provisions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Pill Style) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar (Tablet / Laptop / Desktop) */}
          <div
            ref={desktopSearchRef}
            className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm relative mx-1"
          >
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search provisions, salt, chemicals..."
                value={searchTerm}
                onFocus={() => {
                  if (searchTerm.trim().length >= 1) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Desktop Suggestions Dropdown */}
            {showSuggestions && searchTerm.trim().length >= 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 text-left animate-fadeIn">
                {isLoadingSuggestions ? (
                  <div className="p-3.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                    <span>Searching products...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs font-semibold text-slate-700">No matching products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword</p>
                  </div>
                ) : (
                  <div>
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Related Products</span>
                      <span>{suggestions.length} found</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full p-2.5 hover:bg-emerald-50/70 flex items-center gap-3 transition-colors text-left cursor-pointer group"
                        >
                          <img
                            src={getImageUrl(item.primary_image)}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200 group-hover:border-emerald-300"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate">
                                {item.product_name}
                              </h4>
                              <span className="text-xs font-black text-slate-900 shrink-0 font-mono">
                                ₹{item.effective_price}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.tamil_name && (
                                <span className="text-[11px] text-emerald-800 font-medium truncate">
                                  {item.tamil_name}
                                </span>
                              )}
                              {item.is_in_stock ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-full shrink-0">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full shrink-0">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full p-2.5 bg-slate-50 hover:bg-emerald-50 border-t border-slate-100 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View all results for "{searchTerm}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Admin Quick Switch Button (If logged in as admin) */}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-all shadow-2xs"
                title="Go to Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Admin Console</span>
              </Link>
            )}

            {/* Customer Auth / Name Badge in Top Navbar */}
            {isCustomerLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hidden sm:inline-flex items-center gap-2 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 rounded-full text-xs font-bold text-emerald-900 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                  title="Account Details"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
                    {customerUser?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[110px] truncate font-extrabold text-slate-800">
                    {customerUser?.name || 'Customer'}
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] rounded-full uppercase font-black tracking-wider">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Desktop User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-900 truncate">{customerUser?.name}</p>
                        {isAdmin && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-full font-bold uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{customerUser?.mobile_number}</p>
                    </div>
                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2.5 font-bold transition-colors border-b border-slate-100"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 font-bold transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-bold transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>My Profile</span>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          customerLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition-colors border border-slate-200/80"
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Login</span>
              </Link>
            )}

            {/* Direct App Install Button (Desktop) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-install-app'))}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200/80 cursor-pointer"
              title="Install Roja Traders App"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Install App</span>
            </button>

            {/* Direct WhatsApp Quick Chat CTA (Desktop) */}
            <button
              onClick={handleDirectWhatsAppChat}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#25D366] hover:bg-[#20be5b] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              title="Chat directly on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>WhatsApp</span>
            </button>

            {/* Mobile Logged in User Profile Avatar */}
            {isCustomerLoggedIn && (
              <Link
                to="/profile"
                className="flex md:hidden items-center justify-center w-7 h-7 rounded-full bg-emerald-700 text-white text-[10px] font-black shrink-0 shadow-xs border border-emerald-200 active:scale-95 transition-transform"
                title={customerUser?.name || 'My Profile'}
              >
                {customerUser?.name?.[0]?.toUpperCase() || 'U'}
              </Link>
            )}

            {/* Mobile View: Flexible Search Bar */}
            <div
              ref={mobileSearchRef}
              className="flex md:hidden items-center flex-1 min-w-0 max-w-[190px] relative mx-1"
            >
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onFocus={() => {
                    if (searchTerm.trim().length >= 1) setShowSuggestions(true);
                  }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 bg-slate-100 hover:bg-slate-200/70 focus:bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all shadow-2xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Mobile Auto-Suggestions Dropdown right beneath search bar */}
              {showSuggestions && searchTerm.trim().length >= 1 && (
                <div className="absolute top-full right-[-70px] w-[290px] sm:w-[320px] mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 text-left animate-fadeIn">
                  {isLoadingSuggestions ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching products
                    </div>
                  ) : (
                    <div>
                      <div className="px-3 py-1 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Related Products</span>
                        <span>{suggestions.length} found</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {suggestions.map((item) => (
                          <button
                            key={`mobile-near-cart-${item.id}`}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            className="w-full p-2 hover:bg-emerald-50 flex items-center gap-2.5 text-left cursor-pointer"
                          >
                            <img
                              src={item.primary_image}
                              alt={item.product_name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {item.product_name}
                                </h4>
                                <span className="text-xs font-black text-slate-900 shrink-0 font-mono">
                                  ₹{item.effective_price}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.tamil_name && (
                                  <span className="text-[10px] text-emerald-800 font-medium truncate">
                                    {item.tamil_name}
                                  </span>
                                )}
                                {item.is_in_stock ? (
                                  <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                                    In Stock
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold text-white bg-red-600 px-1 py-0.2 rounded">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full p-2 bg-slate-50 hover:bg-emerald-50 border-t border-slate-100 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>View all results for "{searchTerm}"</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Cart Button (Desktop & Tablet; mobile users access cart via fixed BottomNav) */}
            <button
              onClick={openCart}
              className="hidden sm:flex relative items-center gap-2 py-2 px-3 sm:px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-2xl transition-all shadow-xs cursor-pointer group"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-bold">Cart</span>
              {cartTotalQuantity > 0 && (
                <span className="bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {cartTotalQuantity}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-4 pb-6 space-y-4 shadow-lg animate-fadeIn">
          <div ref={mobileSearchRef} className="relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search provisions, salt, chemicals..."
                value={searchTerm}
                onFocus={() => {
                  if (searchTerm.trim().length >= 1) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && searchTerm.trim().length >= 1 && (
              <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left">
                {isLoadingSuggestions ? (
                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                    <span>Searching products...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No matching products found
                  </div>
                ) : (
                  <div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {suggestions.map((item) => (
                        <button
                          key={`mobile-${item.id}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full p-2.5 hover:bg-emerald-50/70 flex items-center gap-3 text-left"
                        >
                          <img
                            src={getImageUrl(item.primary_image)}
                            alt={item.product_name}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.product_name}
                              </h4>
                              <span className="text-xs font-black text-slate-900 shrink-0 font-mono">
                                ₹{item.effective_price}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.tamil_name && (
                                <span className="text-[11px] text-emerald-800 font-medium truncate">
                                  {item.tamil_name}
                                </span>
                              )}
                              {item.is_in_stock ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.2 rounded">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full p-2 bg-slate-50 hover:bg-emerald-50 border-t border-slate-100 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5"
                    >
                      <span>View all results for "{searchTerm}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-2 px-3 rounded-xl text-sm font-bold transition-colors ${
                    isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-between transition-colors shadow-md border border-emerald-500/30"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Dashboard</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-black tracking-wider">
                  Admin
                </span>
              </Link>
            )}

            {isCustomerLoggedIn && (
              <Link
                to="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-xs font-bold text-emerald-950 flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span>My Orders</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </Link>
            )}

            {isCustomerLoggedIn ? (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                    {customerUser?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{customerUser?.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{customerUser?.mobile_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    customerLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 px-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <span>Customer Login</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Mobile + Pass
                </span>
              </Link>
            )}

            {/* Direct App Install Button (Side Navbar / Drawer) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('trigger-install-app'));
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-between transition-colors border border-emerald-200/60 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#25D366]" />
                <span>Install Roja Traders App</span>
              </span>
              <span className="text-[10px] bg-[#25D366] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                Install
              </span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleDirectWhatsAppChat();
            }}
            className="w-full py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-white stroke-none" />
            <span>Chat on WhatsApp Directly</span>
          </button>
        </div>
      )}
    </header>
  );
}
