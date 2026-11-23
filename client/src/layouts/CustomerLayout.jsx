import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import CartDrawer from '../components/CartDrawer';
import OtpModal from '../components/OtpModal';
import InstallAppBanner from '../components/InstallAppBanner';
import BottomNav from '../components/BottomNav';
import SplashScreen from '../components/SplashScreen';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SplashScreen />
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
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
