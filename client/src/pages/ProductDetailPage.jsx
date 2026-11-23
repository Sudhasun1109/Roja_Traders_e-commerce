import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  PackageX,
  Share2,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getCooldown } = useCart();
  const { isCustomerLoggedIn, customerUser, openOtpModal } = useAuth();
  const { success, error, warning } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  const cooldown = getCooldown(product?.id);
  const isCooldown = cooldown > 0;

  useEffect(() => {
    async function loadProductDetail() {
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data?.product) {
          const p = res.data.product;
          setProduct(p);
          setQuantity(1);

          // Select primary image or first available
          if (p.images && p.images.length > 0) {
            const primary = p.images.find((img) => img.is_primary) || p.images[0];
            setSelectedImage(primary.image_url);
          } else if (p.primary_image) {
            setSelectedImage(p.primary_image);
          }

          // Fetch related items from same category
          if (p.category_id) {
            const relRes = await api.get(`/products?category_id=${p.category_id}&limit=4`);
            if (relRes.data?.products) {
              setRelatedProducts(relRes.data.products.filter((item) => item.id !== p.id));
            }
          }
        }
      } catch (err) {
        error(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }

    loadProductDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-500 font-semibold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
          <PackageX className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Product Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested product could not be located or may have been removed.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const effectivePrice = product.discount_price ? product.discount_price : product.price;
  const discountPercent =
    product.discount_price && product.discount_price < product.price
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : null;

  const handleIncrement = () => {
    if (quantity < product.stock_quantity) {
      setQuantity((q) => q + 1);
    } else {
      warning(`Maximum available stock is ${product.stock_quantity}`);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock || isCooldown) return;
    addToCart(product, quantity);
  };

  const handleWhatsAppOrder = () => {
    if (isOutOfStock) {
      error('This product is currently out of stock.');
      return;
    }

    const sendEnquiry = async (activeUser) => {
      setIsSubmittingEnquiry(true);
      try {
        const payload = {
          items: [{ productId: product.id, quantity }],
          customerName: activeUser?.name || 'Customer',
          customerMobile: activeUser?.mobile_number
        };

        const res = await api.post('/enquiries', payload);
        const whatsappUrl = res.data?.whatsappUrl || res.whatsappUrl;
        const invoiceNumber = res.data?.invoiceNumber || res.invoiceNumber;

        if (whatsappUrl) {
          success(`Invoice #${invoiceNumber || ''} generated! Launching WhatsApp...`);
          window.open(whatsappUrl, '_blank');
        }
      } catch (err) {
        error(err.message || 'Failed to submit enquiry');
      } finally {
        setIsSubmittingEnquiry(false);
      }
    };

    if (!isCustomerLoggedIn) {
      navigate('/login?redirect=order&reason=order_required');
      return;
    }

    sendEnquiry(customerUser);
  };

  const specsList = Object.entries(product.specifications || {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-700 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-700 transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.product_name}</span>
      </div>

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Images Section */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Large Image */}
            <div className="relative aspect-square rounded-3xl bg-slate-50 overflow-hidden border border-slate-200/80 shadow-2xs group">
              <img
                src={selectedImage || 'https://via.placeholder.com/600'}
                alt={product.product_name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Badges on Top of Image */}
              {isOutOfStock ? (
                <div className="absolute top-4 left-4 bg-red-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-red-500 uppercase tracking-wider flex items-center gap-1.5 z-10">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Out of Stock
                </div>
              ) : discountPercent ? (
                <div className="absolute top-4 left-4 bg-rose-500 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md z-10">
                  {discountPercent}% OFF
                </div>
              ) : null}

              {/* Red banner directly on top of image when Out of Stock */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-10 pointer-events-none">
                  <span className="bg-red-600 text-white text-base sm:text-lg font-black px-6 py-2.5 rounded-2xl uppercase tracking-wider shadow-2xl border border-red-400">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedImage === img.image_url
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
                  {product.category_name}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.product_name}
                </h1>
                {product.tamil_name && (
                  <p className="text-sm sm:text-base font-semibold text-emerald-700 mt-1">
                    {product.tamil_name}
                  </p>
                )}
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-black text-slate-900">
                  ₹{parseFloat(effectivePrice).toLocaleString('en-IN')}
                </span>
                {product.discount_price && (
                  <>
                    <span className="text-base text-slate-400 line-through">
                      ₹{parseFloat(product.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      Save ₹{(product.price - product.discount_price).toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status Badge */}
              <div className="pt-1">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                    <PackageX className="w-4 h-4" />
                    <span>Out of Stock</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In Stock</span>
                  </div>
                )}
              </div>

              {/* Specifications */}
              {specsList.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Specifications & Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
                    {specsList.map(([key, val]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-slate-200/50 last:border-none">
                        <span className="text-slate-500 font-medium">{key}:</span>
                        <span className="font-semibold text-slate-900">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ordering Action Area */}
            <div className="space-y-4 pt-4 border-t border-slate-200/80">
              {/* Quantity selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
                  <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="p-2.5 px-3.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900 font-mono">{quantity}</span>
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock_quantity}
                      className="p-2.5 px-3.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    (Subtotal: <strong className="text-slate-800">₹{(parseFloat(effectivePrice) * quantity).toLocaleString('en-IN')}</strong>)
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isCooldown}
                  className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all ${
                    isCooldown
                      ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800 cursor-not-allowed shadow-inner'
                      : isOutOfStock
                      ? 'border-2 border-slate-300 text-slate-400 opacity-30 cursor-not-allowed'
                      : 'border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 cursor-pointer active:scale-98 shadow-sm'
                  }`}
                  title={isCooldown ? `Please wait ${cooldown}s before adding again` : 'Add to Cart'}
                >
                  {isCooldown ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Added to Cart! ({cooldown}s)</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  disabled={isOutOfStock || isSubmittingEnquiry}
                  className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1fb858] text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                  <span>{isSubmittingEnquiry ? 'Preparing Enquiry...' : 'Order on WhatsApp'}</span>
                </button>
              </div>

              {/* Notice */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-[11px] text-emerald-900 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  No online card payment needed. All orders are verified and scheduled directly via official WhatsApp.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              More in {product.category_name}
            </h2>
            <Link
              to={`/products?category_id=${product.category_id}`}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View Category
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
