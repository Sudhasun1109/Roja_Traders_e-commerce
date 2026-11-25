import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import OfferPosterCarousel from '../components/OfferPosterCarousel';
import { useSettings } from '../context/SettingsContext';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';

export default function HomePage() {
  const { settings, whatsappNumber } = useSettings();
  const navigate = useNavigate();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [prodRes, bannerRes] = await Promise.all([
          api.get('/products?limit=24').catch(() => ({ data: { products: [] } })),
          api.get('/banners').catch(() => ({ data: { banners: [] } }))
        ]);

        if (prodRes.data?.products) {
          setFeaturedProducts(prodRes.data.products);
        }
        if (bannerRes.data?.banners) {
          setBanners(bannerRes.data.banners);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleOpenWhatsApp = () => {
    const cleanNumber = (whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
    window.open(
      `https://wa.me/${cleanNumber}?text=Hello!%20I%20am%20browsing%20your%20website%20and%20would%20like%20to%20know%20more.`,
      '_blank'
    );
  };

  const hasOffers = banners.length > 0;

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* 1. Hero Section: Left Text + Right Auto-scrolling Offer Posters, OR Centered when Offers are OFF */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white pt-10 sm:pt-14 pb-8 sm:pb-10 border-b border-emerald-900/30">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-12 right-12 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {hasOffers ? (
            /* First View: Offer Poster Carousel on TOP, Store Content BELOW */
            <div className="space-y-6 sm:space-y-8">
              {/* 1. TOP: Auto-Scrolling Offer Posters Carousel - First View! */}
              <div className="w-full max-w-5xl mx-auto">
                <OfferPosterCarousel initialBanners={banners} />
              </div>

              {/* 2. BELOW: Headline, Description, CTAs & Value Badges */}
              <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                  Quality Products, Honest Prices –{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                    Your Everyday Essentials!
                  </span>
                </h1>

                <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
                  Explore trusted daily groceries, cleaning essentials, rangoli powders & traditional food items. Order instantly via WhatsApp with zero hassle!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-1">
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Explore Catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={handleOpenWhatsApp}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                    <span>Chat on WhatsApp</span>
                  </button>
                </div>

                {/* Quick Micro-Perks */}
                <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs text-slate-300 font-medium border-t border-white/10 max-w-2xl mx-auto">
                  <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold bg-white/10 px-2.5 py-1 rounded-full text-[11px] sm:text-xs">
                    <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Delivery in Tiruppur & Avinashi Only</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> Direct WhatsApp Orders
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> Wholesale & Retail Available
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> Verified Stock
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Centered Layout when Offer Posters are Turned OFF */
            <div className="max-w-4xl mx-auto text-center space-y-6 py-4 sm:py-6">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
                Quality Products, Honest Prices –{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                  Your Everyday Essentials!
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
                Explore trusted daily groceries, cleaning essentials, rangoli powders & traditional food items. Order instantly via WhatsApp with zero hassle!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={handleOpenWhatsApp}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                  <span>Chat on WhatsApp</span>
                </button>
              </div>

              {/* Quick Micro-Perks Centered */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-slate-300 font-medium border-t border-white/10 pt-4 max-w-xl mx-auto">
                <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold bg-white/10 px-2.5 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Delivery in Tiruppur & Avinashi Only</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> Direct WhatsApp Orders
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> Wholesale & Retail Available
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span> Verified Stock
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Auto-scrolling Products Showcase Strip inside Header Section */}
        {featuredProducts.length > 0 && (
          <div className="mt-8 sm:mt-10 pt-5 border-t border-white/10 relative z-10">
            <div className="overflow-hidden relative w-full [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div className="animate-marquee-slow flex gap-4 py-2">
                {featuredProducts.map((prod, idx) => (
                  <Link
                    key={`hero-marquee-1-${prod.id}-${idx}`}
                    to={`/products/${prod.id}`}
                    className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-emerald-400/50 rounded-2xl p-3 pr-5 shrink-0 transition-all duration-300 hover:scale-[1.03] backdrop-blur-md shadow-lg group text-left"
                  >
                    <img
                      src={getImageUrl(prod.primary_image || (prod.images && prod.images[0]?.image_url))}
                      alt={prod.product_name}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-white"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white max-w-[200px] sm:max-w-[230px] truncate group-hover:text-emerald-300 transition-colors">
                        {prod.product_name}
                      </p>
                      {prod.tamil_name && (
                        <p className="text-[11px] text-emerald-300/90 font-medium truncate max-w-[200px] sm:max-w-[230px]">
                          {prod.tamil_name}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-extrabold text-emerald-400">
                          ₹{prod.price}
                        </span>
                        {prod.discount_price && prod.discount_price > prod.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{prod.discount_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Duplicate set for infinite smooth looping */}
                {featuredProducts.map((prod, idx) => (
                  <Link
                    key={`hero-marquee-2-${prod.id}-${idx}`}
                    to={`/products/${prod.id}`}
                    className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-emerald-400/50 rounded-2xl p-3 pr-5 shrink-0 transition-all duration-300 hover:scale-[1.03] backdrop-blur-md shadow-lg group text-left"
                  >
                    <img
                      src={getImageUrl(prod.primary_image || (prod.images && prod.images[0]?.image_url))}
                      alt={prod.product_name}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-white"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white max-w-[200px] sm:max-w-[230px] truncate group-hover:text-emerald-300 transition-colors">
                        {prod.product_name}
                      </p>
                      {prod.tamil_name && (
                        <p className="text-[11px] text-emerald-300/90 font-medium truncate max-w-[200px] sm:max-w-[230px]">
                          {prod.tamil_name}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-extrabold text-emerald-400">
                          ₹{prod.price}
                        </span>
                        {prod.discount_price && prod.discount_price > prod.price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{prod.discount_price}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Our Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Our Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore quality provisions, salts, cleaning supplies, and food essentials.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors shrink-0"
          >
            <span>Browse Complete Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 border border-slate-200/80 animate-pulse space-y-4">
                <div className="aspect-square bg-slate-100 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Contact Us Section */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Get In Touch
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
                  Have Questions or Bulk Order Inquiries?
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Whether you need wholesale volume pricing, custom packaging, or specific product availability, our team in Madurai is ready to assist you right away.
              </p>

              <div className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Direct Call / WhatsApp</p>
                    <p className="font-bold text-slate-900">{whatsappNumber || settings.contact_number || '+91 98765 43210'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Email Us</p>
                    <p className="font-bold text-slate-900">{settings.email || 'support@showcasekart.com'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Store Location</p>
                    <p className="font-bold text-slate-900">{settings.address || 'Madurai / Chennai, Tamil Nadu, India'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleOpenWhatsApp}
                  className="inline-flex items-center gap-2.5 py-3.5 px-7 rounded-2xl bg-[#25D366] hover:bg-[#1fb858] text-white text-sm font-bold shadow-lg shadow-emerald-950/15 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                  <span>Start WhatsApp Chat Now</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50/80 p-6 sm:p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Customer-Friendly Ordering Process
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-600 shrink-0">1.</span>
                  <span><strong>Browse & Select:</strong> Add items to your cart or tap "Order" on any product card.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-600 shrink-0">2.</span>
                  <span><strong>One-Tap WhatsApp:</strong> A pre-formatted order enquiry with product names and quantities opens directly in WhatsApp.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-600 shrink-0">3.</span>
                  <span><strong>Instant Confirmation:</strong> We confirm real-time inventory, provide delivery details, and answer any questions right away.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-bold text-emerald-600 shrink-0">4.</span>
                  <span><strong>Safe & Transparent:</strong> Zero bank details or credit card forms required on site.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
