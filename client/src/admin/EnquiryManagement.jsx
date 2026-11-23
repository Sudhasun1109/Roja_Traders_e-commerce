import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  ExternalLink,
  MessageCircle,
  Eye,
  CheckCircle,
  Clock,
  X,
  User,
  Phone,
  FileText,
  Printer,
  Image as ImageIcon,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';

export default function EnquiryManagement() {
  const { success, error } = useToast();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selection & Delete State
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'single', // 'single' | 'bulk'
    targetId: null,
    targetName: '',
    count: 0
  });
  const [deleting, setDeleting] = useState(false);

  // Detail Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', currentPage);
      params.set('limit', pageSize);

      const res = await api.get(`/admin/enquiries?${params.toString()}`);
      if (res.data?.enquiries) {
        setEnquiries(res.data.enquiries);
      }
      if (res.data?.pagination) {
        setTotalEnquiries(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter, searchTerm, currentPage, pageSize]);

  // Selection handlers
  const allOnPageSelected = enquiries.length > 0 && enquiries.every((e) => selectedIds.includes(e.id));
  const someOnPageSelected = enquiries.some((e) => selectedIds.includes(e.id));

  const handleSelectAll = () => {
    if (allOnPageSelected) {
      const pageIds = enquiries.map((e) => e.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = enquiries.map((e) => e.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Delete triggers
  const openSingleDeleteModal = (enquiry) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      targetId: enquiry.id,
      targetName: enquiry.invoice_number || `Order #${enquiry.id} (${enquiry.customer_name})`,
      count: 1
    });
  };

  const openBulkDeleteModal = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      targetId: null,
      targetName: '',
      count: selectedIds.length
    });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.type === 'single') {
        await api.delete(`/admin/enquiries/${deleteModal.targetId}`);
        success('Order deleted successfully');
        setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.targetId));
      } else {
        const res = await api.post('/admin/enquiries/bulk-delete', { ids: selectedIds });
        success(res.message || `${selectedIds.length} orders deleted successfully`);
        setSelectedIds([]);
      }
      setDeleteModal({ isOpen: false, type: 'single', targetId: null, targetName: '', count: 0 });
      fetchEnquiries();
    } catch (err) {
      error(err.message || 'Failed to delete order(s)');
    } finally {
      setDeleting(false);
    }
  };

  const openDetailModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setNewStatus(enquiry.enquiry_status);
    setNotes(enquiry.notes || '');
  };

  const handleQuickStatusChange = async (enquiryId, nextStatus) => {
    try {
      // Optimistic update in table state
      setEnquiries((prev) =>
        prev.map((item) =>
          item.id === enquiryId ? { ...item, enquiry_status: nextStatus } : item
        )
      );
      await api.put(`/admin/enquiries/${enquiryId}/status`, { enquiry_status: nextStatus });
      success(`Status updated to ${nextStatus.toUpperCase()}`);
    } catch (err) {
      error(err.message || 'Failed to update status');
      fetchEnquiries();
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500';
      case 'contacted':
        return 'bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-500';
      case 'cancelled':
        return 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-500';
      case 'pending':
      default:
        return 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500';
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    setUpdatingStatus(true);
    try {
      await api.put(`/admin/enquiries/${selectedEnquiry.id}/status`, {
        enquiry_status: newStatus,
        notes: notes.trim()
      });
      success('Enquiry updated successfully');
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err) {
      error(err.message || 'Failed to update enquiry status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReplyWhatsApp = (enquiry) => {
    const cleanNumber = (enquiry.customer_mobile || '').replace(/[^0-9]/g, '');
    const invNo = enquiry.invoice_number || `RT-INV-${enquiry.id}`;
    const text = encodeURIComponent(
      `👑 *ROJA TRADERS – ORDER CONFIRMATION* 👑\n\n` +
      `Hello ${enquiry.customer_name}! ✨\n` +
      `Thank you for placing your valued order with us.\n\n` +
      `🏷️ *Order ID  :* *#${invNo}*\n` +
      `💎 *Total     :* *₹${parseFloat(enquiry.total_amount).toFixed(2)}*\n` +
      `📦 *Status    :* *${(enquiry.enquiry_status || 'PENDING').toUpperCase()}*\n\n` +
      `Your order is being processed with priority. We will confirm delivery shortly!\n\n` +
      `🌟 *Roja Traders – Quality & Trust* 🌟`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
  };

  const handleViewInvoice = (enquiry) => {
    const invNo = enquiry.invoice_number || enquiry.id;
    window.open(`/invoice/${invNo}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Orders & Inquiries Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer orders, generate invoice bills, and reply to customers directly on WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/invoice-settings"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoice Settings</span>
          </Link>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100">
            <MessageSquare className="w-4 h-4" />
            <span>{enquiries.length} Orders</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-600"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="text-xs font-bold text-rose-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'order' : 'orders'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={openBulkDeleteModal}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Enquiries Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 font-semibold">Loading orders...</div>
        ) : enquiries.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500">No orders or enquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                      }}
                      onChange={handleSelectAll}
                      title="Select all orders on this page"
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq) => {
                  const isSelected = selectedIds.includes(enq.id);
                  return (
                    <tr
                      key={enq.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-rose-50/50 hover:bg-rose-50/80' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(enq.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        <button
                          onClick={() => handleViewInvoice(enq)}
                          className="hover:underline flex items-center gap-1 text-left"
                          title="Click to view full printable invoice bill"
                        >
                          <span>{enq.invoice_number || `RT-INV-${enq.id}`}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(enq.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{enq.customer_name}</td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {enq.customer_mobile}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-600">
                        {enq.total_quantity} pcs ({enq.items?.length || 0} unique)
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900 font-mono">
                        ₹{parseFloat(enq.total_amount).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={enq.enquiry_status || 'pending'}
                          onChange={(e) => handleQuickStatusChange(enq.id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 capitalize ${getStatusBadgeStyle(
                            enq.enquiry_status
                          )}`}
                          title="Change order status"
                        >
                          <option value="pending" className="bg-white text-amber-800 font-bold">Pending</option>
                          <option value="completed" className="bg-white text-emerald-800 font-bold">Completed</option>
                          <option value="rejected" className="bg-white text-rose-800 font-bold">Rejected</option>
                          {enq.enquiry_status && !['pending', 'completed', 'rejected'].includes(enq.enquiry_status) && (
                            <option value={enq.enquiry_status} className="bg-white text-slate-700 font-bold capitalize">
                              {enq.enquiry_status}
                            </option>
                          )}
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewInvoice(enq)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View / Print Bill"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/api/invoices/${enq.invoice_number || enq.id}/image`, '_blank')}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View / Download Bill Image"
                          >
                            <ImageIcon className="w-4 h-4 text-emerald-700" />
                          </button>
                          <button
                            onClick={() => openDetailModal(enq)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Manage Status & Notes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReplyWhatsApp(enq)}
                            className="px-2.5 py-1 bg-[#25D366] hover:bg-[#1fb858] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            title="Send Invoice to WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                            <span>Bill</span>
                          </button>
                          <button
                            onClick={() => openSingleDeleteModal(enq)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalEnquiries > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalEnquiries}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}
      </div>

      {/* Enquiry Detail & Status Update Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{selectedEnquiry.invoice_number || `Order #${selectedEnquiry.id}`}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Received on {new Date(selectedEnquiry.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bill Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleViewInvoice(selectedEnquiry)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>

              <button
                onClick={() => window.open(`/api/invoices/${selectedEnquiry.invoice_number || selectedEnquiry.id}/image`, '_blank')}
                className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bill Image</span>
              </button>

              <button
                onClick={() => handleReplyWhatsApp(selectedEnquiry)}
                className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                <span>WhatsApp Bill</span>
              </button>
            </div>

            {/* Customer Details Pill */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Information</span>
              <p className="font-extrabold text-slate-900 text-sm">{selectedEnquiry.customer_name}</p>
              <p className="text-emerald-800 font-mono font-bold">{selectedEnquiry.customer_mobile}</p>
            </div>

            {/* Ordered Products Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Billed Items ({selectedEnquiry.items?.length || 0})
              </h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {selectedEnquiry.items?.map((it) => (
                  <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={it.image_url || 'https://via.placeholder.com/60'}
                        alt={it.product_name}
                        className="w-10 h-10 object-cover rounded-xl bg-slate-100 border border-slate-200/80"
                      />
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{it.product_name}</p>
                        {it.tamil_name && (
                          <p className="text-[11px] text-emerald-700 line-clamp-1">{it.tamil_name}</p>
                        )}
                        <p className="text-[10px] text-slate-400 font-mono">
                          ₹{parseFloat(it.unit_price).toFixed(0)} × {it.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="font-extrabold text-slate-900 font-mono">
                      ₹{parseFloat(it.subtotal).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Invoice Total:</span>
                <span className="text-emerald-800 font-mono">
                  ₹{parseFloat(selectedEnquiry.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-3 border-t border-slate-200 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Order / Bill Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 capitalize"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  {newStatus && !['pending', 'completed', 'rejected'].includes(newStatus) && (
                    <option value={newStatus} className="capitalize">
                      {newStatus}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Confirmed for delivery tomorrow via COD"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {deleteModal.type === 'single' ? 'Delete Order' : `Delete ${deleteModal.count} Orders`}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {deleteModal.type === 'single'
                  ? `Are you sure you want to permanently delete order "${deleteModal.targetName}"? This will also remove all associated bill item records.`
                  : `Are you sure you want to permanently delete these ${deleteModal.count} selected orders? All associated item records will be removed.`}
              </p>
              <p className="text-[11px] font-semibold text-rose-600 mt-2">
                ⚠️ This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal({ isOpen: false, type: 'single', targetId: null, targetName: '', count: 0 })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
