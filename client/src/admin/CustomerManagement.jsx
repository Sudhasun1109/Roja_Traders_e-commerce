import React, { useState, useEffect } from 'react';
import { Users, Search, Phone, ShieldCheck, ShieldAlert, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import Pagination from '../components/Pagination';

export default function CustomerManagement() {
  const { success, error } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selection & Delete State
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'single', // 'single' | 'bulk'
    targetId: null,
    targetName: '',
    targetMobile: '',
    count: 0
  });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', currentPage);
      params.set('limit', pageSize);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.users) {
        setUsers(res.data.users);
      }
      if (res.data?.pagination) {
        setTotalUsers(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, currentPage, pageSize]);

  // Selection handlers
  const allOnPageSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));
  const someOnPageSelected = users.some((u) => selectedIds.includes(u.id));

  const handleSelectAll = () => {
    if (allOnPageSelected) {
      const pageIds = users.map((u) => u.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = users.map((u) => u.id);
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

  // Delete handlers
  const openSingleDeleteModal = (user) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      targetId: user.id,
      targetName: user.name,
      targetMobile: user.mobile_number,
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
      targetMobile: '',
      count: selectedIds.length
    });
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.type === 'single') {
        await api.delete(`/admin/users/${deleteModal.targetId}`);
        success('Customer account deleted successfully');
        setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.targetId));
      } else {
        const res = await api.post('/admin/users/bulk-delete', { ids: selectedIds });
        success(res.message || `${selectedIds.length} customer accounts deleted successfully`);
        setSelectedIds([]);
      }
      setDeleteModal({ isOpen: false, type: 'single', targetId: null, targetName: '', targetMobile: '', count: 0 });
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to delete customer(s)');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/users/${user.id}/status`, { status: nextStatus });
      success(`Customer status changed to ${nextStatus}`);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Failed to update customer status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Registered Customers</h1>
          <p className="text-xs text-gray-500 mt-1">
            Shoppers verified by mobile OTP. Active accounts can place direct WhatsApp enquiries.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-bold">
          <Users className="w-4 h-4" />
          <span>{users.length} Total Registered Customers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer mobile number or name..."
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
            <option value="">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="text-xs font-bold text-rose-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'customer' : 'customers'} selected
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

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-gray-500">Loading customer directory...</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-xs text-gray-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                      }}
                      onChange={handleSelectAll}
                      title="Select all customers on this page"
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">OTP Verified</th>
                  <th className="py-3 px-4">Enquiries Placed</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-rose-50/50 hover:bg-rose-50/80' : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(u.id)}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4 font-mono text-gray-400 font-bold">#{u.id}</td>

                      <td className="py-3 px-4 font-bold text-gray-900">{u.name}</td>

                      <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                        {u.mobile_number}
                      </td>

                      <td className="py-3 px-4">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Unverified</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {u.enquiry_count || 0} enquiries
                      </td>

                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => openSingleDeleteModal(u)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer"
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
        {!loading && totalUsers > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalUsers}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                {deleteModal.type === 'single' ? 'Delete Customer' : `Delete ${deleteModal.count} Customers`}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {deleteModal.type === 'single' ? (
                  <>
                    Are you sure you want to delete customer{' '}
                    <span className="font-bold text-gray-800">"{deleteModal.targetName}"</span> ({deleteModal.targetMobile})?
                  </>
                ) : (
                  <>
                    Are you sure you want to delete these <span className="font-bold text-gray-800">{deleteModal.count} selected customer accounts</span>?
                  </>
                )}
              </p>
              <p className="text-[11px] font-semibold text-rose-600 mt-2">
                ⚠️ This account will be removed and cannot be restored.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModal({ isOpen: false, type: 'single', targetId: null, targetName: '', targetMobile: '', count: 0 })}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
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
