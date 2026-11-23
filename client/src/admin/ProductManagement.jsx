import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  RotateCcw,
  Boxes
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';
import { convertGoogleDriveUrl, getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';

export default function ProductManagement() {
  const { success, error, warning } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    product_name: '',
    tamil_name: '',
    description: '',
    price: '',
    discount_price: '',
    category_id: '',
    sku: '',
    stock_quantity: 0,
    status: 'active',
    specifications: {},
    images: [] // Array of { image_url, is_primary }
  });

  // Helper inputs for dynamic specs & image URLs
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?include_inactive=true&limit=100'),
        api.get('/categories')
      ]);
      if (prodRes.data?.products) setProducts(prodRes.data.products);
      if (catRes.data?.categories) setCategories(catRes.data.categories);
    } catch (err) {
      error(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      product_name: '',
      tamil_name: '',
      description: '',
      price: '',
      discount_price: '',
      category_id: categories[0]?.id || '',
      sku: `PROD-${Date.now().toString().slice(-6)}`,
      stock_quantity: 10,
      status: 'active',
      specifications: {},
      images: []
    });
    setNewImageUrl('');
    setNewSpecKey('');
    setNewSpecVal('');
    setIsModalOpen(true);
  };

  const openEditModal = async (product) => {
    try {
      // Fetch full details with images
      const res = await api.get(`/products/${product.id}`);
      const p = res.data?.product || product;
      setEditingProduct(p);

      const imagesFormatted = (p.images || []).map((img) => ({
        image_url: img.image_url,
        is_primary: !!img.is_primary
      }));

      setFormData({
        product_name: p.product_name,
        tamil_name: p.tamil_name || '',
        description: p.description || '',
        price: p.price,
        discount_price: p.discount_price || '',
        category_id: p.category_id,
        sku: p.sku,
        stock_quantity: p.stock_quantity,
        status: p.status,
        specifications: p.specifications || {},
        images: imagesFormatted
      });

      setIsModalOpen(true);
    } catch (err) {
      error('Failed to load product details for editing');
    }
  };

  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [newSpecKey.trim()]: newSpecVal.trim()
      }
    }));
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpec = (keyToRemove) => {
    setFormData((prev) => {
      const copy = { ...prev.specifications };
      delete copy[keyToRemove];
      return { ...prev, specifications: copy };
    });
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const cleanUrl = convertGoogleDriveUrl(newImageUrl.trim());
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { image_url: cleanUrl, is_primary: prev.images.length === 0 }
      ]
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const copy = [...prev.images];
      copy.splice(index, 1);
      if (copy.length > 0 && !copy.some((img) => img.is_primary)) {
        copy[0].is_primary = true;
      }
      return { ...prev, images: copy };
    });
  };

  const handleSetPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index
      }))
    }));
  };

  // Image File Upload via API
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/upload/single', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res.data?.url || res.data?.imageUrl;
      if (uploadedUrl) {
        setFormData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            { image_url: uploadedUrl, is_primary: prev.images.length === 0 }
          ]
        }));
        success('Image uploaded successfully');
      }
    } catch (err) {
      error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_name || !formData.price || !formData.category_id || !formData.sku) {
      error('Please fill all mandatory fields (Name, Price, Category, SKU)');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, formData);
        success('Product updated successfully');
      } else {
        await api.post('/admin/products', formData);
        success('Product created successfully');
      }
      setIsModalOpen(false);
      fetchCatalog();
    } catch (err) {
      error(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/admin/products/${id}`);
      success(res.message || 'Product deleted successfully');
      setDeleteConfirmId(null);
      fetchCatalog();
    } catch (err) {
      error(err.message || 'Failed to delete product');
    }
  };

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStockStatus]);

  // Filtered List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tamil_name && p.tamil_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || String(p.category_id) === String(selectedCategory);

    const matchesStock =
      !selectedStockStatus ||
      (selectedStockStatus === 'in_stock' && p.stock_quantity > 5) ||
      (selectedStockStatus === 'low_stock' && p.stock_quantity > 0 && p.stock_quantity <= 5) ||
      (selectedStockStatus === 'out_of_stock' && p.stock_quantity <= 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Paginated List
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Product Catalog Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create, update, and organize products, pricing, specifications, and gallery photos.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700"
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt; 5)</option>
            <option value="low_stock">Low Stock (1 - 5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {(searchTerm || selectedCategory || selectedStockStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedStockStatus('');
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-gray-500">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-500">
            No products match the chosen criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Price / Discount</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Item with Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(p.primary_image)}
                          alt={p.product_name}
                          className="w-10 h-10 object-cover rounded-xl bg-gray-100 shrink-0 border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{p.product_name}</p>
                          {p.tamil_name && (
                            <p className="text-[11px] text-emerald-700 font-medium line-clamp-1">{p.tamil_name}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-gray-700">{p.category_name}</td>

                    <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{p.sku}</td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">
                        ₹{parseFloat(p.discount_price || p.price).toLocaleString('en-IN')}
                      </div>
                      {p.discount_price && (
                        <div className="text-[10px] text-gray-400 line-through">
                          ₹{parseFloat(p.price).toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          p.stock_quantity <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : p.stock_quantity <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.stock_quantity} in stock
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Product Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Rock Salt – First Quality"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tamil Product Name (தமிழ் பெயர்)
                  </label>
                  <input
                    type="text"
                    value={formData.tamil_name}
                    onChange={(e) => setFormData({ ...formData, tamil_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. கல் உப்பு – முதல் தரம்"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Regular Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Discount Price (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                    placeholder="Product highlights, styling notes, material descriptions..."
                  />
                </div>
              </div>

              {/* Specifications Key-Value Editor */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Product Specifications (Key-Value)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Key (e.g. Material)"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 100% Combed Cotton)"
                    value={newSpecVal}
                    onChange={(e) => setNewSpecVal(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-xl hover:bg-black"
                  >
                    Add
                  </button>
                </div>

                {/* Specs chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(formData.specifications).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs"
                    >
                      <strong>{k}:</strong> {v}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(k)}
                        className="text-gray-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Product Gallery Images */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Product Images
                </label>

                {/* File upload & URL adder */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste Image URL (https://...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-xl hover:bg-black"
                    >
                      Add URL
                    </button>
                  </div>

                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                {/* Current Images Thumbnails */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                  {formData.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                        img.is_primary ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-gray-200'
                      }`}
                    >
                      <img src={img.image_url} alt="product" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 flex items-center justify-between text-[10px] text-white">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className={img.is_primary ? 'text-emerald-400 font-bold' : 'hover:text-emerald-300'}
                          title="Set as Primary"
                        >
                          {img.is_primary ? 'Primary' : 'Make Main'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="text-rose-400 hover:text-rose-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Confirm Product Deletion</h3>
            <p className="text-xs text-gray-500">
              Are you sure? If this item was referenced in past customer orders, it will be safely deactivated to protect history records.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
