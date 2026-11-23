import React, { useState, useEffect } from 'react';
import { Smartphone, X, CheckCircle2 } from 'lucide-react';
import RoyalLogo from './RoyalLogo';

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    // Check if app is already running in standalone/installed mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // Capture standard PWA beforeinstallprompt event for 1-click install
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('roja_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPopup(true), 1200);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Auto-show small install prompt on entrance if not previously dismissed
    const dismissed = sessionStorage.getItem('roja_install_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for custom trigger to directly install app from navbar or drawer
  useEffect(() => {
    const handleTriggerInstall = () => {
      handleDirectInstall();
    };
    window.addEventListener('trigger-install-app', handleTriggerInstall);
    return () => window.removeEventListener('trigger-install-app', handleTriggerInstall);
  }, [deferredPrompt]);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDirectInstall = async () => {
    // 1. Direct native 1-click PWA installation (No APK download, No instructions)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setShowPopup(false);
          showNotification('Roja Traders App installed successfully!');
        }
        setDeferredPrompt(null);
      } catch (e) {
        console.error('Direct install prompt error:', e);
      }
      return;
    }

    // 2. If app is already installed
    if (isInstalled || window.matchMedia('(display-mode: standalone)').matches) {
      showNotification('Roja Traders is already installed on your device!');
      setShowPopup(false);
      return;
    }

    // 3. Fallback when browser has already processed prompt or is iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      showNotification("To install: Tap Safari Share (⎙) and select 'Add to Home Screen'.");
    } else {
      showNotification("Direct install: Click the install icon (⊕) in your browser address bar.");
    }
    setShowPopup(false);
  };

  const handleDismiss = () => {
    setShowPopup(false);
    sessionStorage.setItem('roja_install_dismissed', 'true');
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* Direct App Install Popup (Zero APK Download - Direct PWA) */}
      {/* ======================================================== */}
      {showPopup && (
        <div className="fixed bottom-20 left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-[360px] z-50 bg-white/95 border border-slate-200/90 rounded-3xl shadow-2xl p-4 animate-fadeIn backdrop-blur-md">
          <div className="flex items-start gap-3.5">
            {/* Brand Logo */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#06241a] via-[#0b3324] to-[#04160f] p-1 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-md">
              <RoyalLogo className="w-full h-full drop-shadow-md" />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-slate-900 truncate">Roja Traders App</h4>
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full shrink-0">
                  App
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Install directly to your home screen for fast 1-tap shopping.
              </p>

              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={handleDirectInstall}
                  className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20be5b] active:bg-[#1caa51] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>

            {/* Dismiss Cross */}
            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors absolute top-2.5 right-2.5"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
