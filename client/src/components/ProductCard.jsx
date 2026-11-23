import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, ShoppingBag, Eye, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';
import api from '../services/api';

export default function ProductCard({ product }) {
  const { addToCart, getCooldown } = useCart();
  const { isCustomerLoggedIn, customerUser, openOtpModal } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const cooldown = getCooldown(product?.id);
  const isCooldown = cooldown > 0;

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const effectivePrice = product.discount_price ? product.discount_price : product.price;
  const originalPrice = product.price;
  const discountPercent =
    product.discount_price && product.discount_price < product.price
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : null;

  // Direct WhatsApp Enquiry for single product
  const handleDirectWhatsAppOrder = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      error(`"${product.product_name}" is currently out of stock`);
      return;
    }

    const sendEnquiry = async (activeUser) => {
      try {
        const payload = {
          items: [{ productId: product.id, quantity: 1 }],
          customerName: activeUser?.name || 'Customer',
          customerMobile: activeUser?.mobile_number
        };

        const res = await api.post('/enquiries', payload);
        if (res?.data?.whatsappUrl) {
          success('Launching WhatsApp with your order enquiry...');
          window.open(res.data.whatsappUrl, '_blank');
        }
      } catch (err) {
        error(err.message || 'Failed to submit enquiry');
      }
    };

    if (!isCustomerLoggedIn) {
      navigate('/login?redirect=order&reason=order_required');
      return;
    }

    sendEnquiry(customerUser);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isCooldown) return;
    addToCart(product, 1);
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Container */}
      <Link to={`/products/${product.id}`} className="relative block aspect-square bg-slate-50 overflow-hidden">
        <img
          src={getImageUrl(product.primary_image)}
          alt={product.product_name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg border border-red-500 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Out of Stock
            </span>
          ) : (
            <>
              {discountPercent && (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
              <span className="bg-white/95 backdrop-blur-md text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs border border-emerald-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In Stock
              </span>
            </>
          )}
        </div>

        {/* Prominent Red Banner directly on top of image when Out of Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-2 z-10 pointer-events-none">
            <span className="bg-red-600 text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl uppercase tracking-wider shadow-2xl border border-red-400">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick view overlay icon on hover */}
        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.id}`} className="block min-h-[44px]">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {product.product_name}
            </h3>
            {product.tamil_name && (
              <p className="text-[11px] font-medium text-emerald-800 line-clamp-1 mt-0.5">
                {product.tamil_name}
              </p>
            )}
          </Link>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-2.5">
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{parseFloat(effectivePrice).toLocaleString('en-IN')}
            </span>
            {product.discount_price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{parseFloat(originalPrice).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isCooldown}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                isCooldown
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 cursor-not-allowed'
                  : isOutOfStock
                  ? 'border border-slate-200 text-slate-400 opacity-40 cursor-not-allowed'
                  : 'border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-800 cursor-pointer'
              }`}
              title={isCooldown ? `Please wait ${cooldown}s before adding again` : 'Add to Cart'}
            >
              {isCooldown ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                  <span>Added ({cooldown}s)</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="hidden sm:inline">Add to Cart</span>
                  <span className="sm:hidden">Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleDirectWhatsAppOrder}
              disabled={isOutOfStock}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-[#25D366] hover:bg-[#20be5b] text-white text-xs font-bold shadow-xs hover:shadow-md disabled:opacity-40 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none shrink-0" />
              <span>Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
