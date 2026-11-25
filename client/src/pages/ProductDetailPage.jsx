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
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';
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
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
        <Link to="/" className="hover:text-emerald-700 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-700 transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[180px] sm:max-w-xs">{product.product_name}</span>
      </div>

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-3.5 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 lg:gap-10">
          {/* Images Section */}
          <div className="lg:col-span-6 space-y-2.5 sm:space-y-4">
            {/* Primary Responsive Image Container */}
            <div className="relative w-full h-56 sm:h-72 lg:h-auto lg:aspect-square rounded-2xl bg-slate-50/90 overflow-hidden border border-slate-200/80 shadow-2xs group flex items-center justify-center p-2.5 sm:p-4">
              <img
                src={getImageUrl(selectedImage)}
                alt={product.product_name}
                className="max-w-full max-h-full object-contain object-center drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />

              {/* Badges on Top of Image */}
              {isOutOfStock ? (
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 bg-red-600 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-lg border border-red-500 uppercase tracking-wider flex items-center gap-1 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Out of Stock
                </div>
              ) : discountPercent ? (
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 bg-rose-500 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md z-10">
                  {discountPercent}% OFF
                </div>
              ) : null}

              {/* Red banner directly on top of image when Out of Stock */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center p-3 z-10 pointer-events-none">
                  <span className="bg-red-600 text-white text-sm sm:text-lg font-black px-4 sm:px-6 py-2 rounded-xl sm:rounded-2xl uppercase tracking-wider shadow-2xl border border-red-400">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.image_url)}
                    className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      selectedImage === img.image_url
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImageUrl(img.image_url)}
                      alt="thumbnail"
                      className="w-full h-full object-contain p-1 bg-white"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-3.5 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Category & Stock Status in a Single Header Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                  {product.category_name}
                </span>

                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] sm:text-xs font-bold border border-rose-100">
                    <PackageX className="w-3.5 h-3.5" />
                    <span>Out of Stock</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs font-bold border border-emerald-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In Stock</span>
                  </div>
                )}
              </div>

              {/* Title & Tamil Name */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {product.product_name}
                </h1>
                {product.tamil_name && (
                  <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5">
                    {product.tamil_name}
                  </p>
                )}
              </div>

              {/* Price & Quantity Selector on a Single Row on Mobile */}
              <div className="flex items-center justify-between gap-2 py-2 border-y border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₹{parseFloat(effectivePrice).toLocaleString('en-IN')}
                  </span>
                  {discountPercent ? (
                    <>
                      <span className="text-xs sm:text-base text-slate-400 line-through">
                        ₹{parseFloat(product.price).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    </>
                  ) : null}
                </div>

                {/* Inline Quantity selector */}
                {!isOutOfStock && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden shadow-2xs">
                      <button
                        onClick={handleDecrement}
                        disabled={quantity <= 1}
                        className="p-1.5 px-2.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs sm:text-sm font-bold text-slate-900 font-mono">{quantity}</span>
                      <button
                        onClick={handleIncrement}
                        disabled={quantity >= product.stock_quantity}
                        className="p-1.5 px-2.5 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: 2-Column Grid on Mobile for Maximum Accessibility */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || isCooldown}
                    className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2.5 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      isCooldown
                        ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-800 cursor-not-allowed shadow-inner'
                        : isOutOfStock
                        ? 'border-2 border-slate-300 text-slate-400 opacity-30 cursor-not-allowed'
                        : 'border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 active:scale-98 shadow-2xs'
                    }`}
                    title={isCooldown ? `Please wait ${cooldown}s before adding again` : 'Add to Cart'}
                  >
                    {isCooldown ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span>Added ({cooldown}s)</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    disabled={isOutOfStock || isSubmittingEnquiry}
                    className="flex items-center justify-center gap-1.5 py-2.5 sm:py-3.5 px-2.5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#25D366] hover:bg-[#1fb858] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-98 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                    <span>{isSubmittingEnquiry ? 'Preparing...' : 'Order on WhatsApp'}</span>
                  </button>
                </div>

                {/* Micro-Notice */}
                <div className="p-2 sm:p-2.5 bg-emerald-50/70 border border-emerald-200/50 rounded-xl text-[10px] sm:text-[11px] text-emerald-900 flex items-center justify-center gap-2 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>No card payment required · Verified direct delivery on WhatsApp</span>
                </div>
              </div>

              {/* Specifications */}
              {specsList.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Specifications & Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 bg-slate-50/80 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 text-xs">
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
