import React, { useState, useEffect } from 'react';
import RoyalLogo from './RoyalLogo';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if splash was already shown in this session
    const shown = sessionStorage.getItem('roja_splash_shown');
    if (shown) {
      setIsVisible(false);
      return;
    }

    // Run 1.2s branded splash screen animation on first entrance
    const timerFade = setTimeout(() => {
      setIsFading(true);
    }, 1100);

    const timerDismiss = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('roja_splash_shown', 'true');
    }, 1500);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerDismiss);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#06241a] via-[#04160f] to-[#020b08] text-white transition-opacity duration-400 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center px-6 text-center animate-scaleUp">
        {/* Glowing Logo Container */}
        <div className="relative mb-5">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#06241a] via-[#0b3324] to-[#04160f] p-3 border border-emerald-400/40 shadow-2xl flex items-center justify-center">
            <RoyalLogo className="w-full h-full drop-shadow-2xl" />
          </div>
        </div>

        {/* Brand Typography */}
        <h1 className="text-2xl font-black tracking-tight text-white font-['Cinzel',serif]">
          ROJA TRADERS
        </h1>
        <p className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase mt-1">
          Quality Everyday Provisions
        </p>

        {/* Subtle loading indicator */}
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden mt-8">
          <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-[#25D366] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
