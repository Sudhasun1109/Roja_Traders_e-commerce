import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RotateCcw,
  X,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useSettings } from '../context/SettingsContext';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, whatsappNumber } = useSettings();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state from URL
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') || '';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const sort = searchParams.get('sort') || 'latest';

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get('/categories');
        if (res.data?.categories) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch products whenever search params change
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (categoryId) params.set('category_id', categoryId);
        if (inStockOnly) params.set('in_stock', 'true');
        if (sort) params.set('sort', sort);
        params.set('limit', '50');

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data?.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchParams]);

  const handleOpenWhatsApp = () => {
    const cleanNumber = (whatsappNumber || '919597993402').replace(/[^0-9]/g, '');
    window.open(
      `https://wa.me/${cleanNumber}?text=Hello!%20I%20am%20browsing%20your%20products%20catalog%20and%20would%20like%20to%20enquire.`,
      '_blank'
    );
  };

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === false) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = !!(search || categoryId || inStockOnly || sort !== 'latest');

  const selectedCategoryName = categories.find((c) => String(c.id) === String(categoryId))?.category_name;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Product Page Header Banner (Optimized for Laptop/Desktop view to eliminate empty voids) */}
      <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-gray-950 text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-lg relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left half: Catalog title & value proposition */}
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold tracking-wide backdrop-blur-md border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct WhatsApp Catalog</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Product Showcase
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              Explore quality grocery essentials, salt products, cleaning supplies, and traditional fryums at affordable prices. Select your favorites and order effortlessly through WhatsApp.
            </p>
          </div>

          {/* Right half: Novel Interactive WhatsApp Ordering Desk & Highlights (Fills the laptop view) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                  <MessageCircle className="w-6 h-6 fill-white stroke-none" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-xs font-bold text-white">Direct WhatsApp Desk</p>
                  </div>
                  <p className="text-[11px] text-emerald-300">Wholesale & retail enquiries</p>
                </div>
              </div>
              <button
                onClick={handleOpenWhatsApp}
                className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20be5b] text-white font-bold text-xs shadow-md transition-all whitespace-nowrap cursor-pointer hover:scale-105"
              >
                Chat Now
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[11px] text-gray-300">
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-3">
                <span className="font-extrabold text-white text-xs block">100% Genuine</span>
                <span className="text-[10px] text-gray-400">Provisions</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-2 px-3">
                <span className="font-extrabold text-emerald-400 text-xs block">Zero Checkout Barrier</span>
                <span className="text-[10px] text-gray-400">Instant WhatsApp Order</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* 1. Category Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="category-select" className="text-xs font-bold text-gray-700 whitespace-nowrap">
              Category:
            </label>
            <select
              id="category-select"
              value={categoryId}
              onChange={(e) => updateParam('category_id', e.target.value)}
              className="bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 rounded-2xl px-3.5 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer min-w-[200px] sm:min-w-[240px] transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-bold text-gray-700 whitespace-nowrap">
              Sort:
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 rounded-2xl px-3.5 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer min-w-[170px] transition-all"
              >
                <option value="latest">Latest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="featured">Best In Stock</option>
              </select>
            </div>
          </div>

          {/* 3. In-Stock Filter Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : '')}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
            />
            <span className="text-xs font-medium text-gray-700">In Stock Only</span>
          </label>
        </div>

        {/* Results Counter & Search Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800 font-medium">
              <span>Search: <strong>"{search}"</strong></span>
              <button
                onClick={() => updateParam('search', '')}
                className="p-0.5 hover:bg-emerald-200 rounded-full text-emerald-600 cursor-pointer"
                title="Clear navbar search"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {selectedCategoryName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 rounded-full text-xs text-teal-800 font-medium">
              <span>Category: <strong>{selectedCategoryName}</strong></span>
              <button
                onClick={() => updateParam('category_id', '')}
                className="p-0.5 hover:bg-teal-200 rounded-full text-teal-600 cursor-pointer"
                title="Clear category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3.5 py-1.5 rounded-full border border-gray-200">
            {products.length} {products.length === 1 ? 'Product' : 'Products'} Available
          </div>
        </div>
      </div>

      {/* Products Grid (Spacious 4-Column Layout) */}
      <div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-100 animate-pulse space-y-3">
                <div className="aspect-square bg-gray-200 rounded-2xl" />
                <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                <div className="h-3 bg-gray-200 rounded-md w-1/2" />
                <div className="h-9 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-gray-100 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No matching products found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              We couldn't find any products matching the selected category or filters. Try choosing a different category or clearing filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
