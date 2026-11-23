import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    website_name: 'Roja Traders',
    whatsapp_number: '919876543210',
    contact_number: '+91 98765 43210',
    address: 'Chennai, Tamil Nadu, India',
    email: 'support@rojatraders.com',
    description: 'Quality grocery, household essentials, salt products, cleaning chemicals, and provisions at affordable prices.',
    logo_url: '/logo-rt.svg',
    footer_text: '© 2026 Roja Traders. All rights reserved.'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Re-fetch on window focus to ensure multi-tab instant sync
    const handleFocus = () => {
      fetchSettings();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic sync every 15 seconds
    const interval = setInterval(fetchSettings, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        whatsappNumber: settings.whatsapp_number,
        websiteName: settings.website_name
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
