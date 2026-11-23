import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import CartDrawer from '../components/CartDrawer';
import OtpModal from '../components/OtpModal';
import InstallAppBanner from '../components/InstallAppBanner';
import BottomNav from '../components/BottomNav';
import SplashScreen from '../components/SplashScreen';

export default function CustomerLayout() {
  const { isAdminLoggedIn } = useAuth();

  // If administrator is logged in, restrict to Admin Console only (do not show customer store)
  if (isAdminLoggedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full max-w-full">
      <SplashScreen />
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden w-full max-w-full">
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <CartDrawer />
      <OtpModal />
      <InstallAppBanner />
      <BottomNav />
    </div>
  );
}
