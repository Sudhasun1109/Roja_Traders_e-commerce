import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Users,
  Boxes,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  Clock,
  Phone
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh live online customer counter every 10 seconds
    const interval = setInterval(() => {
      api.get('/admin/live-visitors')
        .then((res) => {
          if (res.data?.onlineCustomers !== undefined) {
            setData((prev) => prev ? {
              ...prev,
              stats: { ...prev.stats, onlineCustomers: res.data.onlineCustomers }
            } : prev);
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-semibold">Loading dashboard statistics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentEnquiries = data?.recentEnquiries || [];
  const lowStock = data?.lowStockProducts || [];
  const categoryDist = data?.categoryDistribution || [];
  const recentUsers = data?.recentUsers || [];

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-gray-700">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
              Store Performance Control
            </span>
            {/* Small green color dot online customer counter */}
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 shadow-sm backdrop-blur-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{stats.onlineCustomers || 1} Customer Online</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Showcase Dashboard</h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Live metrics on catalog availability, WhatsApp customer orders, registered shoppers, and real-time online visitors.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/products"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            to="/admin/stock"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold transition-all"
          >
            <Boxes className="w-4 h-4" />
            <span>Manage Stock</span>
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold transition-all"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Setup</span>
          </Link>
        </div>
      </div>

      {/* 7 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Customer Online */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-white p-5 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Online</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {stats.onlineCustomers || 1}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
              <span>Customer Online</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Products</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalProducts || 0}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {stats.activeProducts || 0} Active Live
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalCategories || 0}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Catalog groups</div>
          </div>
        </div>

        {/* Total Registered Users */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Shoppers</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalUsers || 0}</div>
            <div className="text-[11px] text-teal-700 font-semibold mt-0.5">Registered Mobiles</div>
          </div>
        </div>

        {/* Total Available Stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Live Stock</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalAvailableStock || 0}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Units in inventory</div>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{stats.outOfStockProducts || 0}</div>
            <div className="text-[11px] text-rose-500 font-medium mt-0.5">Needs restock</div>
          </div>
        </div>

        {/* Total Enquiries */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Enquiries</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{stats.totalEnquiries || 0}</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
              ₹{(stats.totalEnquiryValue || 0).toLocaleString('en-IN')} total val
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Category inventory breakdown & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Category distribution visual bars */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Category Stock Distribution</span>
            </div>
            <Link to="/admin/categories" className="text-xs text-emerald-600 font-semibold hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {categoryDist.map((cat, idx) => {
              const maxStock = Math.max(...categoryDist.map((c) => parseInt(c.total_stock || 0, 10)), 1);
              const percentage = Math.round((parseInt(cat.total_stock || 0, 10) / maxStock) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{cat.category_name}</span>
                    <span className="text-gray-500">
                      {cat.product_count} items • {cat.total_stock} stock
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Stock Alerts (≤ 5 items)</span>
            </div>
            <Link to="/admin/stock" className="text-xs text-amber-700 font-semibold hover:underline">
              View All Stock
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All items are sufficiently stocked!
            </div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden">
              {lowStock.map((prod) => (
                <div key={prod.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 line-clamp-1">{prod.product_name}</h5>
                    <span className="text-[10px] text-gray-400 font-mono">SKU: {prod.sku} • {prod.category_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        prod.stock_quantity <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prod.stock_quantity <= 0 ? 'Out of Stock' : `${prod.stock_quantity} left`}
                    </span>
                    <Link
                      to="/admin/stock"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Recent Enquiries & Recent Registered Users */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Enquiries */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Recent WhatsApp Enquiries</span>
            </div>
            <Link to="/admin/enquiries" className="text-xs text-emerald-600 font-semibold hover:underline">
              View All Enquiries
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              No customer enquiries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Mobile</th>
                    <th className="py-2.5">Quantity</th>
                    <th className="py-2.5">Total Value</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentEnquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-gray-50">
                      <td className="py-3 font-bold text-gray-900">{enq.customer_name}</td>
                      <td className="py-3 text-gray-600 font-mono">{enq.customer_mobile}</td>
                      <td className="py-3 text-gray-600">{enq.total_quantity} pcs</td>
                      <td className="py-3 font-extrabold text-gray-900">
                        ₹{parseFloat(enq.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span
                          className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            enq.enquiry_status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : enq.enquiry_status === 'contacted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {enq.enquiry_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Registered Users */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Recent Shoppers</span>
            </div>
            <Link to="/admin/customers" className="text-xs text-emerald-600 font-semibold hover:underline">
              All Users
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h6 className="text-xs font-bold text-gray-900">{u.name}</h6>
                  <p className="text-[11px] text-gray-500 font-mono">{u.mobile_number}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
