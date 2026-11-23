import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Customer Auth State
  const [customerUser, setCustomerUser] = useState(() => {
    const saved = localStorage.getItem('customer_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [customerToken, setCustomerToken] = useState(() => localStorage.getItem('customer_token'));

  // Admin Auth State
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('admin_token'));

  // Customer verification modal trigger
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [onOtpSuccessCallback, setOnOtpSuccessCallback] = useState(null);

  // Sync customer state with localStorage
  useEffect(() => {
    if (customerUser && customerToken) {
      localStorage.setItem('customer_user', JSON.stringify(customerUser));
      localStorage.setItem('customer_token', customerToken);
    } else {
      localStorage.removeItem('customer_user');
      localStorage.removeItem('customer_token');
    }
  }, [customerUser, customerToken]);

  // Sync admin state with localStorage
  useEffect(() => {
    if (adminUser && adminToken) {
      localStorage.setItem('admin_user', JSON.stringify(adminUser));
      localStorage.setItem('admin_token', adminToken);
    } else {
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_token');
    }
  }, [adminUser, adminToken]);

  // Customer Mobile + Password methods with Role-Based Access Control
  const customerLogin = async (mobileNumber, password, countryCode = '+91') => {
    const res = await api.post('/auth/login', { mobileNumber, password, countryCode });
    const { user, admin, role, token, adminToken } = res.data;

    // If logged in as admin, set admin auth credentials simultaneously
    if (role === 'admin' || user?.role === 'admin') {
      const effectiveAdminToken = adminToken || token;
      const effectiveAdminUser = admin || { id: user?.id, username: user?.name, role: 'admin' };
      setAdminUser(effectiveAdminUser);
      setAdminToken(effectiveAdminToken);
    }

    setCustomerUser(user);
    setCustomerToken(token);
    return res.data;
  };

  const customerRegister = async (name, mobileNumber, password, countryCode = '+91') => {
    const res = await api.post('/auth/register', { name, mobileNumber, password, countryCode });
    setCustomerUser(res.data.user);
    setCustomerToken(res.data.token);
    return res.data;
  };

  // Simplified No-OTP Forgot Password methods
  const verifyForgotPasswordMobile = async (mobileNumber, countryCode = '+91') => {
    const res = await api.post('/auth/forgot-password/verify-mobile', { mobileNumber, countryCode });
    return res.data;
  };

  const changePasswordDirect = async (mobileNumber, newPassword, countryCode = '+91') => {
    const res = await api.post('/auth/forgot-password/change', { mobileNumber, newPassword, countryCode });
    return res.data;
  };

  const requestPasswordReset = async (mobileNumber, countryCode = '+91') => {
    const res = await api.post('/auth/forgot-password/request', { mobileNumber, countryCode });
    return res.data;
  };

  const resetPassword = async (mobileNumber, otp, newPassword, countryCode = '+91') => {
    const res = await api.post('/auth/forgot-password/reset', { mobileNumber, otp, newPassword, countryCode });
    return res.data;
  };

  // Customer methods (OTP)
  const requestOtp = async (mobileNumber, countryCode = '+91') => {
    const res = await api.post('/auth/send-otp', { mobileNumber, countryCode });
    return res.data;
  };

  const confirmOtp = async (mobileNumber, otp, name, countryCode = '+91') => {
    const res = await api.post('/auth/verify-otp', { mobileNumber, otp, name, countryCode });
    setCustomerUser(res.data.user);
    setCustomerToken(res.data.token);

    if (onOtpSuccessCallback && typeof onOtpSuccessCallback === 'function') {
      onOtpSuccessCallback(res.data.user);
      setOnOtpSuccessCallback(null);
    }
    setIsOtpModalOpen(false);
    return res.data;
  };

  const customerLogout = async () => {
    try {
      if (customerToken) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore
    } finally {
      setCustomerUser(null);
      setCustomerToken(null);
    }
  };

  const openOtpModal = (callback) => {
    if (callback) {
      setOnOtpSuccessCallback(() => callback);
    }
    setIsOtpModalOpen(true);
  };

  const closeOtpModal = () => {
    setIsOtpModalOpen(false);
    setOnOtpSuccessCallback(null);
  };

  // Admin methods (Accepts Mobile Number or Username + Password)
  const adminLogin = async (identifier, password, countryCode = '+91') => {
    const trimmed = (identifier || '').toString().trim();
    const hasDigits = /\d{7,}/.test(trimmed);
    const payload = hasDigits
      ? { mobileNumber: trimmed, countryCode, password }
      : { username: trimmed, password };

    const res = await api.post('/admin/login', payload);
    const { admin, user, token, adminToken } = res.data;

    const effectiveAdminToken = adminToken || token;
    const effectiveAdminUser = admin || (user ? { id: user.id, username: user.name, role: 'admin' } : null);

    setAdminUser(effectiveAdminUser);
    setAdminToken(effectiveAdminToken);

    if (user) {
      setCustomerUser(user);
      setCustomerToken(token);
    }
    return res.data;
  };

  const adminLogout = () => {
    setAdminUser(null);
    setAdminToken(null);
  };

  const updateAdminProfileData = (updatedAdmin, newToken) => {
    setAdminUser(updatedAdmin);
    if (newToken) setAdminToken(newToken);
  };

  return (
    <AuthContext.Provider
      value={{
        customerUser,
        customerToken,
        isCustomerLoggedIn: !!customerToken && !!customerUser,
        customerLogin,
        customerRegister,
        verifyForgotPasswordMobile,
        changePasswordDirect,
        requestPasswordReset,
        resetPassword,
        requestOtp,
        confirmOtp,
        customerLogout,
        isOtpModalOpen,
        openOtpModal,
        closeOtpModal,

        adminUser,
        adminToken,
        isAdminLoggedIn: !!adminToken && !!adminUser,
        adminLogin,
        adminLogout,
        updateAdminProfileData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
