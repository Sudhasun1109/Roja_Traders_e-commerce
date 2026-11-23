import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Download,
  MapPin
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';
import api from '../services/api';

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotalQuantity
  } = useCart();

  const { isCustomerLoggedIn, customerUser, openOtpModal } = useAuth();
  const { success, error, warning } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  if (!isCartOpen) return null;

  const triggerEnquirySubmission = async (activeUser) => {
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        })),
        customerName: activeUser?.name || 'Customer',
        customerMobile: activeUser?.mobile_number
      };

      const res = await api.post('/enquiries', payload);
      const whatsappUrl = res.data?.whatsappUrl || res.whatsappUrl;
      const invoiceNumber = res.data?.invoiceNumber || res.invoiceNumber;

      if (whatsappUrl) {
        success(`👑 Order created! Launching WhatsApp...`);
        setCompletedOrder({
          invoiceNumber,
          whatsappUrl,
          totalAmount: cartSubtotal,
          totalQuantity: cartTotalQuantity
        });
        clearCart();
        // Also launch WhatsApp
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      error(err.message || 'Failed to generate WhatsApp order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const MIN_ORDER_AMOUNT = 200;

  const handleProceedWhatsApp = () => {
    if (cartItems.length === 0) {
      warning('Your cart is empty');
      return;
    }

    if (cartSubtotal < MIN_ORDER_AMOUNT) {
      warning(
        `Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Please add items worth ₹${(
          MIN_ORDER_AMOUNT - cartSubtotal
        ).toFixed(0)} more to place order.`
      );
      return;
    }

    // If user is not logged in when ordering, redirect to login page with 2s popup
    if (!isCustomerLoggedIn) {
      closeCart();
      navigate('/login?redirect=order&reason=order_required');
      return;
    }

    triggerEnquirySubmission(customerUser);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Your Enquiry Cart</h2>
                <p className="text-[11px] text-slate-400 font-medium">Direct WhatsApp Order</p>
              </div>
              <span className="ml-1 bg-emerald-100/90 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {cartTotalQuantity}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Customer Viewpoint: Delivery Location Notice */}
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold shadow-2xs">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Delivery available to <strong className="text-emerald-700 underline decoration-emerald-500">Tiruppur & Avinashi</strong> only</span>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {completedOrder ? (
              <div className="text-center py-8 px-3 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-400/20 via-emerald-100 to-emerald-200 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-emerald-300/40">
                  <span className="text-3xl">👑</span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Royal Order Submitted
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2.5">
                    Order #{completedOrder.invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                    Your royal order enquiry has been created and opened in WhatsApp. Our team will verify and reply directly!
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-4">
                  <a
                    href={completedOrder.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#25D366] hover:bg-[#1fb858] text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                    <span>Open WhatsApp Chat</span>
                  </a>

                  <button
                    onClick={() => {
                      setCompletedOrder(null);
                      closeCart();
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-700 border border-emerald-100">
                  <ShoppingBag className="w-10 h-10 opacity-70" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
                  Browse our catalog, pick products you like, and send an order enquiry directly to our WhatsApp!
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/products');
                  }}
                  className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Explore Products
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-white hover:bg-slate-50/60 rounded-2xl border border-slate-200/80 transition-all shadow-2xs"
                >
                  {/* Thumbnail */}
                  <img
                    src={getImageUrl(item.primary_image)}
                    alt={item.product_name}
                    className="w-20 h-20 object-cover rounded-xl bg-slate-50 shrink-0 border border-slate-200/60"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {item.product_name}
                          </h4>
                          {item.tamil_name && (
                            <p className="text-[11px] text-emerald-700 font-medium line-clamp-1">
                              {item.tamil_name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 shrink-0 rounded-lg hover:bg-rose-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-black text-emerald-800 mt-1">
                        ₹{parseFloat(item.effective_price).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 px-2 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity}
                          className="p-1 px-2 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{(parseFloat(item.effective_price) * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Checkout */}
          {cartItems.length > 0 && !completedOrder && (
            <div className="p-5 border-t border-slate-200/80 bg-slate-50/70 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Total Items</span>
                  <span className="font-bold text-slate-900">{cartTotalQuantity} pcs</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="text-emerald-800">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Minimum Order Criteria Banner */}
              {cartSubtotal < 200 ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-bold shadow-2xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Min Order: ₹200</span>
                  </div>
                  <span className="text-amber-800 font-extrabold bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300/80">
                    Add ₹{(200 - cartSubtotal).toFixed(0)} more
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Min order criteria met (₹200+). Ready to order!</span>
                </div>
              )}

              {/* Note about WhatsApp checkout */}
              <div className="p-3 bg-emerald-50 border border-emerald-200/70 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-900 leading-tight">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  No online card payment required! One click creates your formatted enquiry and opens official WhatsApp chat.
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleProceedWhatsApp}
                  disabled={isSubmitting || cartSubtotal < 200}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 font-bold text-sm rounded-2xl shadow-lg transition-all ${
                    cartSubtotal < 200
                      ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-[#25D366] hover:bg-[#1fb858] text-white shadow-emerald-500/20 active:scale-98 cursor-pointer'
                  }`}
                >
                  <MessageCircle className={`w-4 h-4 ${cartSubtotal < 200 ? 'fill-slate-400' : 'fill-white'} stroke-none`} />
                  <span>
                    {isSubmitting
                      ? 'Validating...'
                      : cartSubtotal < 200
                      ? `Min ₹200 (Add ₹${(200 - cartSubtotal).toFixed(0)} more)`
                      : 'Order on WhatsApp'}
                  </span>
                  {cartSubtotal >= 200 && <ArrowRight className="w-4 h-4" />}
                </button>

                <button
                  onClick={closeCart}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
