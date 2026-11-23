import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Search, ArrowRight, Sparkles, Layers } from 'lucide-react';
import api from '../services/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data?.categories || res.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = categories.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.category_name && c.category_name.toLowerCase().includes(q)) ||
      (c.tamil_name && c.tamil_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200/60">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Store Catalog</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Explore All Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a category to view fresh stock and order via WhatsApp
          </p>
        </div>

        {/* Search filter */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse h-36"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <LayoutGrid className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
          <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {filtered.map((cat, idx) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group relative bg-white hover:bg-emerald-50/50 rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-emerald-300 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-100 to-emerald-50 text-emerald-800 flex items-center justify-center font-black text-sm mb-3 group-hover:scale-105 transition-transform border border-emerald-200/60 shadow-2xs">
                  {idx + 1}
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                  {cat.category_name}
                </h3>
                {cat.tamil_name && (
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5 line-clamp-1">
                    {cat.tamil_name}
                  </p>
                )}
                {cat.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 pt-3 mt-3 border-t border-slate-100">
                <span>Browse Products</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
