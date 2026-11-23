import React, { useState, useEffect } from 'react';
import { Settings, Save, MessageCircle, Phone, Mail, MapPin, Globe, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function WebsiteSettings() {
  const { refreshSettings } = useSettings();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    website_name: '',
    whatsapp_number: '',
    contact_number: '',
    address: '',
    email: '',
    description: '',
    footer_text: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/admin/settings');
        if (res.data?.settings) {
          const s = res.data.settings;
          setFormData({
            website_name: s.website_name || '',
            whatsapp_number: s.whatsapp_number || '',
            contact_number: s.contact_number || '',
            address: s.address || '',
            email: s.email || '',
            description: s.description || '',
            footer_text: s.footer_text || ''
          });
        }
      } catch (err) {
        error(err.message || 'Failed to load website settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.website_name || !formData.whatsapp_number) {
      error('Website Name and WhatsApp Number are mandatory');
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/settings', formData);
      success('Website settings updated successfully! All future WhatsApp enquiries will use this number.');
      await refreshSettings();
    } catch (err) {
      error(err.message || 'Failed to update website settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Website & WhatsApp Configuration</h1>
        <p className="text-xs text-gray-500 mt-1">
          Customize website identity, contact coordinates, and admin WhatsApp recipient number.
        </p>
      </div>

      {/* Critical Alert */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
        <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Dynamic WhatsApp Destination Number:</strong>
          Any change made to the WhatsApp number below takes effect immediately. All new customer enquiries generated on the storefront and product cards will be addressed directly to the updated number without code restarts.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Website Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Website Brand Name *
            </label>
            <input
              type="text"
              required
              value={formData.website_name}
              onChange={(e) => setFormData({ ...formData, website_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 font-semibold"
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Admin WhatsApp Number *</span>
              <span className="text-emerald-700 font-normal lowercase">(digits only, e.g. 919876543210)</span>
            </label>
            <div className="relative">
              <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-emerald-900 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Contact Hotline */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Display Contact Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Support Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@showcase.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Business Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Store Description & Value Proposition
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* Physical Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Storefront / Office Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Text */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Footer Copyright Notice
            </label>
            <input
              type="text"
              value={formData.footer_text}
              onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
