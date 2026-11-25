import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tag
} from 'lucide-react';
import api from '../services/api';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';

export default function OfferPosterCarousel({ initialBanners = null }) {
  const [banners, setBanners] = useState(initialBanners || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(initialBanners === null);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    if (initialBanners !== null) {
      setBanners(initialBanners);
      setLoading(false);
      return;
    }
    async function loadBanners() {
      try {
        const res = await api.get('/banners');
        if (res.data?.banners && res.data.banners.length > 0) {
          setBanners(res.data.banners);
        } else {
          setBanners([]);
        }
      } catch (err) {
        console.warn('Failed to fetch offer banners:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, [initialBanners]);

  // Auto-scroll timer (slides every 4 seconds)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [banners.length, isPaused]);

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading && banners.length === 0) {
    return (
      <div className="w-full h-80 sm:h-[400px] lg:h-[440px] rounded-3xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center">
        <div className="text-center space-y-2">
          <Sparkles className="w-8 h-8 text-emerald-400 animate-spin mx-auto opacity-60" />
          <p className="text-xs text-slate-400">Loading offer posters...</p>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className="relative w-full h-56 sm:h-72 md:h-80 lg:h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl group select-none bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Clickable Poster Link - Entire poster image is clickable */}
      <Link
        to={currentBanner.link_url || '/products'}
        className="block w-full h-full relative cursor-pointer"
        title={`View Offer: ${currentBanner.title}`}
      >
        {/* Background Poster Image Slides - Full Visibility, No Dark Mask */}
        {banners.map((b, idx) => (
          <div
            key={b.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Pure High-Visibility Poster Image */}
            <img
              src={getImageUrl(b.image_url)}
              alt={b.title}
              className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-700"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
              }}
            />

            {/* Subtle Top Glass Gradient only behind top badge for readability */}
            <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent pointer-events-none" />

            {/* Subtle Bottom Soft Shadow for dots */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ))}

        {/* TOP: Offer Name & Offer Badge only */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 sm:p-5 flex items-center justify-between gap-3 text-left">
          <div className="flex flex-wrap items-center gap-2 max-w-[80%]">
            {/* Offer Badge / Tag */}
            {currentBanner.badge_text && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-xs font-black tracking-wide uppercase shadow-md backdrop-blur-md border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentBanner.badge_text}</span>
              </span>
            )}

            {currentBanner.discount_tag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/95 text-white text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md">
                <Tag className="w-3 h-3" />
                <span>{currentBanner.discount_tag}</span>
              </span>
            )}

            {/* Offer Name */}
            <span className="text-white text-sm sm:text-base font-extrabold px-3 py-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 drop-shadow-md truncate max-w-full">
              {currentBanner.title}
            </span>
          </div>

          {/* Slide Index Counter */}
          <span className="px-2.5 py-1 rounded-full bg-black/60 text-[11px] font-mono font-bold text-white backdrop-blur-md border border-white/20 shrink-0">
            {currentIndex + 1} / {banners.length}
          </span>
        </div>
      </Link>

      {/* BOTTOM: Minimal Clean Pagination Dots */}
      <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-2 pointer-events-none">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            className={`pointer-events-auto transition-all rounded-full cursor-pointer ${
              idx === currentIndex
                ? 'w-7 h-2 bg-emerald-400 shadow-md'
                : 'w-2 h-2 bg-white/60 hover:bg-white'
            }`}
            aria-label={`Go to offer poster ${idx + 1}`}
          />
        ))}
      </div>

      {/* Left/Right Arrow Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/20 cursor-pointer shadow-lg"
            aria-label="Previous offer poster"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md border border-white/20 cursor-pointer shadow-lg"
            aria-label="Next offer poster"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
