import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ContactPage from './pages/ContactPage';
import InvoicePage from './pages/InvoicePage';
import LoginPage from './pages/LoginPage';
import CategoriesPage from './pages/CategoriesPage';
import MyOrdersPage from './pages/MyOrdersPage';
import CustomerProfilePage from './pages/CustomerProfilePage';

import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminProtectedRoute from './admin/AdminProtectedRoute';
import AdminDashboard from './admin/AdminDashboard';
import ProductManagement from './admin/ProductManagement';
import StockManagement from './admin/StockManagement';
import CategoryManagement from './admin/CategoryManagement';
import EnquiryManagement from './admin/EnquiryManagement';
import BannerManagement from './admin/BannerManagement';
import CustomerManagement from './admin/CustomerManagement';
import WebsiteSettings from './admin/WebsiteSettings';
import InvoiceSettings from './admin/InvoiceSettings';
import AdminProfile from './admin/AdminProfile';

export default function App() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* Public Digital Invoice / Bill View & Print */}
      <Route path="/invoice/:invoiceNumber" element={<InvoicePage />} />

      {/* Customer & Admin Unified Authentication (Mobile + Password with RBAC) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Redirect old admin login path directly to unified login */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      {/* Admin Protected Console */}
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="enquiries" element={<EnquiryManagement />} />
          <Route path="banners" element={<BannerManagement />} />
          <Route path="invoice-settings" element={<InvoiceSettings />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="settings" element={<WebsiteSettings />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
