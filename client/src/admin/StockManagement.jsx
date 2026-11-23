import React, { useState, useEffect } from 'react';
import {
  Boxes,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Search,
  History,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle,
  X,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/urlHelper';
import Pagination from '../components/Pagination';

export default function StockManagement() {
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination for Inventory Tab
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(10);

  // Pagination for History Tab
  const [histPage, setHistPage] = useState(1);
  const [histPageSize, setHistPageSize] = useState(10);

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [changeType, setChangeType] = useState('increase'); // 'increase' | 'decrease' | 'set'
  const [quantity, setQuantity] = useState(5);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingItemIds, setLoadingItemIds] = useState({});

  // Direct Live Stock Increment / Decrement without full page reload
  const handleLiveStockChange = async (item, changeType, delta = 1) => {
    const previousStock = item.stock_quantity;
    let nextStock = previousStock;
    if (changeType === 'increase') {
      nextStock = previousStock + delta;
    } else if (changeType === 'decrease') {
      if (delta > previousStock) {
        warning(`Cannot decrease by ${delta}. Current stock is only ${previousStock}.`);
        return;
      }
      nextStock = previousStock - delta;
    }

    const nextStatus = nextStock <= 0 ? 'Out of Stock' : nextStock <= 5 ? 'Low Stock' : 'In Stock';

    // Live optimistic update on the current page
    setInventory((prev) =>
      prev.map((p) =>
        p.id === item.id
          ? { ...p, stock_quantity: nextStock, stock_status: nextStatus }
          : p
      )
    );

    setLoadingItemIds((prev) => ({ ...prev, [item.id]: true }));

    try {
      await api.put(`/admin/stock/${item.id}`, {
        changeType,
        quantity: delta,
        notes: `Live quick ${changeType === 'increase' ? '+' : '-'}${delta} adjustment`
      });

      // Refresh stock history silently in background
      api.get('/admin/stock-history?limit=50').then((res) => {
        if (res.data?.history) setHistory(res.data.history);
      }).catch(() => {});
    } catch (err) {
      // Rollback on error
      setInventory((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, stock_quantity: previousStock, stock_status: item.stock_status }
            : p
        )
      );
      error(err.message || 'Failed to update stock live');
    } finally {
      setLoadingItemIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [invRes, histRes] = await Promise.all([
        api.get('/admin/stock'),
        api.get('/admin/stock-history?limit=50')
      ]);

      if (invRes.data?.inventory) setInventory(invRes.data.inventory);
      if (histRes.data?.history) setHistory(histRes.data.history);
    } catch (err) {
      error(err.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const openAdjustModal = (product, initialType = 'increase') => {
    setSelectedProduct(product);
    setChangeType(initialType);
    setQuantity(5);
    setNotes('');
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      error('Please enter a valid non-negative number');
      return;
    }

    if (changeType === 'decrease' && qty > selectedProduct.stock_quantity) {
      error(`Cannot decrease by ${qty}. Available stock is only ${selectedProduct.stock_quantity}.`);
      return;
    }

    setSubmitting(true);
    try {
      let nextStock = selectedProduct.stock_quantity;
      if (changeType === 'increase') nextStock += qty;
      else if (changeType === 'decrease') nextStock = Math.max(0, nextStock - qty);
      else if (changeType === 'set') nextStock = qty;

      const nextStatus = nextStock <= 0 ? 'Out of Stock' : nextStock <= 5 ? 'Low Stock' : 'In Stock';

      // Live optimistic update
      setInventory((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, stock_quantity: nextStock, stock_status: nextStatus }
            : p
        )
      );

      await api.put(`/admin/stock/${selectedProduct.id}`, {
        changeType,
        quantity: qty,
        notes: notes.trim() || `Manual admin stock adjustment: ${changeType}`
      });
      success(`Updated stock for "${selectedProduct.product_name}"`);
      setSelectedProduct(null);
      // Refresh history in background
      api.get('/admin/stock-history?limit=50').then((res) => {
        if (res.data?.history) setHistory(res.data.history);
      }).catch(() => {});
    } catch (err) {
      error(err.message || 'Failed to update stock');
      fetchStockData();
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setInvPage(1);
  }, [searchTerm, statusFilter]);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'in_stock' && item.stock_quantity > 5) ||
      (statusFilter === 'low_stock' && item.stock_quantity > 0 && item.stock_quantity <= 5) ||
      (statusFilter === 'out_of_stock' && item.stock_quantity <= 0);

    return matchesSearch && matchesStatus;
  });

  // Paginated Inventory
  const totalInvItems = filteredInventory.length;
  const totalInvPages = Math.ceil(totalInvItems / invPageSize) || 1;
  const paginatedInventory = filteredInventory.slice(
    (invPage - 1) * invPageSize,
    invPage * invPageSize
  );

  // Paginated History
  const totalHistItems = history.length;
  const totalHistPages = Math.ceil(totalHistItems / histPageSize) || 1;
  const paginatedHistory = history.slice(
    (histPage - 1) * histPageSize,
    histPage * histPageSize
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Stock & Inventory Manager</h1>
          <p className="text-xs text-gray-500 mt-1">
            Increase, decrease, or set live product stock with full audit tracking.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock Inventory ({inventory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History</span>
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search inventory by title or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700"
              >
                <option value="">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; 5)</option>
                <option value="low_stock">Low Stock (1 - 5)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>

              {(searchTerm || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                  title="Reset Filter"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-xs text-gray-500">Loading inventory data...</div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-16 text-center text-xs text-gray-500">No inventory records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Current Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quick Stock Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getImageUrl(item.primary_image)}
                              alt={item.product_name}
                              className="w-10 h-10 object-cover rounded-xl bg-gray-100 border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                              }}
                            />
                            <span className="font-bold text-gray-900">{item.product_name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-gray-500">{item.sku}</td>

                        <td className="py-3 px-4 text-gray-600">{item.category_name}</td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleLiveStockChange(item, 'decrease', 1)}
                              disabled={item.stock_quantity <= 0 || loadingItemIds[item.id]}
                              className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-black flex items-center justify-center border border-rose-200/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer shadow-2xs"
                              title="Deduce 1 live"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-black text-gray-900 font-mono min-w-[32px] text-center">
                              {item.stock_quantity}
                            </span>
                            <button
                              onClick={() => handleLiveStockChange(item, 'increase', 1)}
                              disabled={loadingItemIds[item.id]}
                              className="w-6 h-6 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black flex items-center justify-center border border-emerald-200/80 transition-all active:scale-90 cursor-pointer shadow-2xs"
                              title="Increment 1 live"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.stock_status === 'Out of Stock'
                                ? 'bg-rose-100 text-rose-800'
                                : item.stock_status === 'Low Stock'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.stock_status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleLiveStockChange(item, 'decrease', 5)}
                              disabled={item.stock_quantity < 5 || loadingItemIds[item.id]}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Quick deduce 5 units live"
                            >
                              -5
                            </button>
                            <button
                              onClick={() => handleLiveStockChange(item, 'increase', 5)}
                              disabled={loadingItemIds[item.id]}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                              title="Quick increment 5 units live"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => openAdjustModal(item, 'increase')}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Custom / Set Stock"
                            >
                              Custom
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Inventory Pagination Controls */}
            {!loading && totalInvItems > 0 && (
              <Pagination
                currentPage={invPage}
                totalPages={totalInvPages}
                totalItems={totalInvItems}
                itemsPerPage={invPageSize}
                onPageChange={setInvPage}
                onItemsPerPageChange={setInvPageSize}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            )}
          </div>
        </>
      ) : (
        /* Audit History Table */
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          {history.length === 0 ? (
            <div className="p-16 text-center text-xs text-gray-500">No stock history entries recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Change Type</th>
                    <th className="py-3 px-4">Previous Stock</th>
                    <th className="py-3 px-4">Updated Stock</th>
                    <th className="py-3 px-4">Admin By</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(h.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">{h.product_name}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">{h.sku}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            h.change_type === 'increase'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.change_type === 'decrease'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {h.change_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">{h.previous_stock}</td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{h.updated_stock}</td>
                      <td className="py-3 px-4 font-semibold text-gray-700">{h.updated_by}</td>
                      <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate">{h.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History Pagination Controls */}
          {totalHistItems > 0 && (
            <Pagination
              currentPage={histPage}
              totalPages={totalHistPages}
              totalItems={totalHistItems}
              itemsPerPage={histPageSize}
              onPageChange={setHistPage}
              onItemsPerPageChange={setHistPageSize}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Adjust Product Stock</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedProduct.product_name}</p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-2xl flex justify-between items-center">
                <span className="text-gray-500 font-medium">Current Available Stock:</span>
                <span className="text-lg font-black text-gray-900 font-mono">
                  {selectedProduct.stock_quantity} pcs
                </span>
              </div>

              {/* Adjustment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Action Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChangeType('increase')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      changeType === 'increase'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Increase</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType('decrease')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      changeType === 'decrease'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Decrease</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType('set')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      changeType === 'set'
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>Set Fixed</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {changeType === 'set' ? 'New Total Stock' : 'Units to Adjust'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Audit Notes / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received new shipment from supplier batch #34"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
