import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Upload,
  ArrowRight,
  Image as ImageIcon,
  Tag,
  X,
  Save
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import { convertGoogleDriveUrl } from '../utils/urlHelper';

export default function BannerManagement() {
  const { success, error, warning } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterOffersEnabled, setMasterOffersEnabled] = useState(true);
  const [togglingMaster, setTogglingMaster] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: '🔥 SPECIAL OFFER',
    discount_tag: '',
    image_url: '',
    link_url: '/products',
    button_text: 'Order on WhatsApp',
    display_order: 0,
    is_active: true
  });

  const fetchMasterStatus = async () => {
    try {
      const res = await api.get('/admin/banners/master-status');
      if (res.data && typeof res.data.show_offer_banners !== 'undefined') {
        setMasterOffersEnabled(Boolean(res.data.show_offer_banners));
      }
    } catch (err) {
      console.warn('Failed to fetch master banner status:', err);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/banners');
      if (res.data?.banners) {
        setBanners(res.data.banners);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch offer posters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchMasterStatus();
  }, []);

  const handleToggleMasterOffers = async () => {
    const nextVal = !masterOffersEnabled;
    setTogglingMaster(true);
    try {
      await api.put('/admin/banners/master-status', { show_offer_banners: nextVal });
      setMasterOffersEnabled(nextVal);
      success(
        nextVal
          ? 'Homepage offer posters turned ON. 2-column layout active.'
          : 'Homepage offer posters turned OFF. Hero text center-aligned.'
      );
    } catch (err) {
      error(err.message || 'Failed to update offer display setting');
    } finally {
      setTogglingMaster(false);
    }
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      badge_text: '🔥 SPECIAL OFFER',
      discount_tag: '',
      image_url: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=1000&auto=format&fit=crop&q=80',
      link_url: '/products',
      button_text: 'Order on WhatsApp',
      display_order: banners.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge_text: banner.badge_text || '🔥 SPECIAL OFFER',
      discount_tag: banner.discount_tag || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '/products',
      button_text: banner.button_text || 'Order on WhatsApp',
      display_order: banner.display_order || 0,
      is_active: Boolean(banner.is_active)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'image_url' && typeof finalValue === 'string') {
      finalValue = convertGoogleDriveUrl(finalValue);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/upload/single', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data?.url || res.data?.imageUrl;
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image_url: uploadedUrl }));
        success('Poster image uploaded successfully!');
      } else {
        error('Uploaded image URL not found in server response');
      }
    } catch (err) {
      error(err.message || 'Failed to upload image file');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Poster title is required');
      return;
    }
    if (!formData.image_url.trim()) {
      error('Poster image URL is required');
      return;
    }

    const cleanImageUrl = convertGoogleDriveUrl(formData.image_url.trim());
    const payload = {
      ...formData,
      image_url: cleanImageUrl
    };

    setSaving(true);
    try {
      if (editingBanner) {
        await api.put(`/admin/banners/${editingBanner.id}`, payload);
        success('Offer poster updated successfully!');
      } else {
        await api.post('/admin/banners', payload);
        success('New offer poster created successfully!');
      }
      closeModal();
      fetchBanners();
    } catch (err) {
      error(err.message || 'Failed to save offer poster');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      const newStatus = !banner.is_active;
      await api.put(`/admin/banners/${banner.id}/status`, { is_active: newStatus });
      success(`Poster marked ${newStatus ? 'Active' : 'Inactive'}`);
      fetchBanners();
    } catch (err) {
      error(err.message || 'Failed to update poster status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the offer poster "${title}"?`)) {
      return;
    }
    try {
      await api.delete(`/admin/banners/${id}`);
      success('Offer poster deleted successfully');
      fetchBanners();
    } catch (err) {
      error(err.message || 'Failed to delete offer poster');
    }
  };

  const totalItems = banners.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedBanners = banners.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homepage Hero Banners</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Offer Posters & Promotional Banners
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage promotional offer posters displayed in the auto-scrolling hero section on the homepage.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Offer Poster</span>
        </button>
      </div>

      {/* Master Switch: Turn OFF / ON Homepage Offer Posters */}
      <div className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        masterOffersEnabled
          ? 'bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white border-emerald-700/50'
          : 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white border-rose-800/40'
      }`}>
        <div className="flex items-start sm:items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
            masterOffersEnabled
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
              : 'bg-rose-500/20 text-rose-400 border border-rose-400/30'
          }`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Homepage Offer Posters Master Switch
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-xs ${
                masterOffersEnabled
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {masterOffersEnabled ? '● TURNED ON' : '○ TURNED OFF'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {masterOffersEnabled
                ? 'Offer posters are currently VISIBLE on the Homepage (2-column layout: Text on Left, Auto-scrolling Posters on Right).'
                : 'Offer posters are currently TURNED OFF. Homepage hero text is automatically CENTER-ALIGNED for a clean layout.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-1 sm:pt-0">
          <button
            onClick={handleToggleMasterOffers}
            disabled={togglingMaster}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 ${
              masterOffersEnabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {masterOffersEnabled ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>{togglingMaster ? 'Updating...' : 'Turn OFF Offers'}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{togglingMaster ? 'Updating...' : 'Turn ON Offers'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Posters Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 font-semibold">
          Loading offer posters...
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Offer Posters Found</h3>
          <p className="text-xs text-slate-500">Create your first hero offer poster to showcase special discounts.</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl"
          >
            Create Offer Poster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedBanners.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-3xl border overflow-hidden shadow-2xs transition-all hover:shadow-md ${
                b.is_active ? 'border-slate-200/80' : 'border-slate-200 opacity-60'
              }`}
            >
              {/* Poster Image Preview */}
              <div className="relative h-56 w-full bg-slate-900 overflow-hidden">
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="w-full h-full object-cover"
                />
                {/* Subtle Top Gradient */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 max-w-[80%]">
                    {b.badge_text && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                        {b.badge_text}
                      </span>
                    )}
                    {b.discount_tag && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase shadow-xs">
                        {b.discount_tag}
                      </span>
                    )}
                    <span className="text-white text-xs font-bold px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-xs drop-shadow-sm truncate block">
                      {b.title}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono shrink-0">
                    #{b.display_order}
                  </span>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="p-4 flex items-center justify-between text-xs border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(b)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      b.is_active
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {b.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{b.is_active ? 'Active on Homepage' : 'Hidden / Inactive'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Edit Poster"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Poster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalItems > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={[6, 12, 24, 48]}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">
                {editingBanner ? 'Edit Offer Poster' : 'Create New Offer Poster'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Poster Main Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Wholesale Salt & Kitchen Provisions Combo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Offer Description</label>
                <textarea
                  rows={2}
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Pure first-grade rock salt, powdered salt & cooking staples at honest wholesale prices."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    name="badge_text"
                    value={formData.badge_text}
                    onChange={handleInputChange}
                    placeholder="e.g. 🔥 BULK SAVINGS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Tag (Optional)</label>
                  <input
                    type="text"
                    name="discount_tag"
                    value={formData.discount_tag}
                    onChange={handleInputChange}
                    placeholder="e.g. Flat 20% Off"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Image Input & Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Poster Image URL *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://... or upload local image file"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                    required
                  />
                  <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-1 mt-1 text-[11px] text-slate-400">
                  <span>Supports local file upload, web URLs, and Google Drive links.</span>
                  {formData.image_url && formData.image_url.includes('googleusercontent.com/d/') && (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Google Drive link auto-converted
                    </span>
                  )}
                </div>
              </div>

              {/* Image Live Preview */}
              {formData.image_url && (
                <div className="h-32 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-900">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end text-white">
                    <span className="font-bold text-xs">{formData.title || 'Poster Title Preview'}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    name="button_text"
                    value={formData.button_text}
                    onChange={handleInputChange}
                    placeholder="e.g. Order on WhatsApp"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Link URL</label>
                  <input
                    type="text"
                    name="link_url"
                    value={formData.link_url}
                    onChange={handleInputChange}
                    placeholder="/products or /products?category_id=1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">Show on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingBanner ? 'Update Poster' : 'Create Poster'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
