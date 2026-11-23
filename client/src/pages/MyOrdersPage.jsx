import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShoppingBag,
  FileText,
  RefreshCw,
  MessageCircle,
  PhoneCall,
  Package,
  Truck,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';

export default function MyOrdersPage() {
  const { isCustomerLoggedIn, customerUser } = useAuth();
  const { whatsappNumber } = useSettings();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMyOrders = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const res = await api.get('/enquiries/my-orders');
      setOrders(res.data?.orders || res.orders || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      if (showRefreshSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isCustomerLoggedIn) {
      fetchMyOrders();
      // Auto-poll every 8 seconds so customer sees admin status changes live
      const interval = setInterval(() => {
        fetchMyOrders(false);
      }, 8000);

      // Also refresh whenever window/tab comes into focus
      const handleFocus = () => fetchMyOrders(false);
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setLoading(false);
    }
  }, [isCustomerLoggedIn]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          step: 3,
          label: 'Completed / Delivered',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          description: 'Your order has been fully processed and delivered. Thank you for your purchase!'
        };
      case 'contacted':
        return {
          step: 2,
          label: 'Confirmed & Preparing',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: PhoneCall,
          description: 'Order confirmed by store admin! Your goods are being packaged for dispatch.'
        };
      case 'rejected':
        return {
          step: 0,
          label: 'Rejected',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: XCircle,
          description: 'This order could not be fulfilled at this time.'
        };
      case 'cancelled':
        return {
          step: 0,
          label: 'Cancelled',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: XCircle,
          description: 'This order has been marked as cancelled.'
        };
      case 'pending':
      default:
        return {
          step: 1,
          label: 'Under Review / Pending',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
          description: 'Order placed via WhatsApp. Our team is verifying stock and pricing.'
        };
    }
  };

  const handleWhatsAppEnquiry = (order) => {
    const cleanNumber = (whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
    const invNo = order.invoice_number || `RT-INV-${order.id}`;
    const text = encodeURIComponent(
      `Hello Roja Traders! I am checking the status of my Order #${invNo} (Total: ₹${parseFloat(order.total_amount).toFixed(0)}). Current Status: ${(order.enquiry_status || 'PENDING').toUpperCase()}.`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  if (!isCustomerLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Receipt className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Track Your Orders</h2>
        <p className="text-xs text-slate-500 mt-1.5 mb-6 leading-relaxed">
          Please log in with your registered mobile number to view your past orders, status updates, and digital invoices.
        </p>
        <button
          onClick={() => navigate('/login?redirect=orders')}
          className="w-full py-3 bg-[#25D366] hover:bg-[#20be5b] text-white font-bold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
        >
          Customer Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-12 animate-fadeIn">
      {/* Top Banner with Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Order History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Past WhatsApp order enquiries for <strong className="text-slate-800">{customerUser?.name}</strong> ({customerUser?.mobile_number})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Pulse Indicator (Icon retained, text removed) */}
          <div className="flex items-center justify-center p-2 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200/80 shadow-2xs" title="Auto status sync active">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchMyOrders(true)}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-40" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6 leading-relaxed">
            Browse our fresh provisions catalog, add items to your shopping cart, and submit directly to WhatsApp!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.enquiry_status);
            const StatusIcon = statusConfig.icon;
            const isCancelledOrRejected = ['rejected', 'cancelled'].includes(order.enquiry_status);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                {/* Header with Invoice #, Date, and Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 font-mono tracking-tight">
                          #{order.invoice_number}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Ordered on {new Date(order.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize shadow-2xs ${statusConfig.badgeClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>
                </div>

                {/* Visual Order Progress Stepper (for Active Orders) */}
                {!isCancelledOrRejected ? (
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between relative">
                      {/* Connecting Line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-500"
                          style={{
                            width:
                              statusConfig.step === 1 ? '0%' : statusConfig.step === 2 ? '50%' : '100%'
                          }}
                        />
                      </div>

                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            statusConfig.step >= 1
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          ✓
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 mt-1">Placed</span>
                      </div>

                      {/* Step 2: Confirmed */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            statusConfig.step >= 2
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : statusConfig.step === 1
                              ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {statusConfig.step >= 2 ? '✓' : '2'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 mt-1">Confirmed</span>
                      </div>

                      {/* Step 3: Delivered */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            statusConfig.step >= 3
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {statusConfig.step >= 3 ? '✓' : '3'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 mt-1">Delivered</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 text-center mt-3 font-medium">
                      {statusConfig.description}
                    </p>
                  </div>
                ) : (
                  <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Status: {statusConfig.label}</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">{statusConfig.description}</p>
                    </div>
                  </div>
                )}

                {/* Admin Internal / Customer Notes Box */}
                {order.notes && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-start gap-2 text-xs">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-950 uppercase text-[10px] tracking-wider block">
                        Store Admin Update:
                      </span>
                      <p className="text-emerald-900 font-medium mt-0.5">{order.notes}</p>
                    </div>
                  </div>
                )}

                {/* Items Summary Table */}
                <div className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/40 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    <span>Items Ordered ({order.total_quantity} pcs)</span>
                    <span>Subtotal</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {order.items &&
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                          <div className="pr-4">
                            <span className="font-bold text-slate-800 block">
                              {item.product_name}
                            </span>
                            {item.tamil_name && (
                              <span className="text-[11px] text-emerald-800 block">
                                {item.tamil_name}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              ₹{parseFloat(item.unit_price).toFixed(0)} × {item.quantity}
                            </span>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0 font-mono text-xs">
                            ₹{parseFloat(item.subtotal).toFixed(0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Footer with Total and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                      Total Order Amount
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-800 font-mono">
                      ₹{parseFloat(order.total_amount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Chat with Store on WhatsApp */}
                    <button
                      onClick={() => handleWhatsAppEnquiry(order)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20be5b] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                      title="Enquire on WhatsApp about this order"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                      <span>WhatsApp Store</span>
                    </button>

                    {/* View Digital Invoice Bill */}
                    <Link
                      to={`/invoice/${order.invoice_number}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Bill</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
