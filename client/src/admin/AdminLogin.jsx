import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, ArrowRight, RefreshCw, Sparkles, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RoyalLogo from '../components/RoyalLogo';

export default function AdminLogin() {
  const { adminLogin, isAdminLoggedIn } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect cleanly via component return
  if (isAdminLoggedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(username.trim(), password);
      success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } catch (err) {
      error(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back to Store link */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md"
        >
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Store</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <RoyalLogo className="w-16 h-16 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-white tracking-tight">Roja Traders</h2>
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-0.5">Admin Console</p>
          <p className="text-xs text-gray-400 mt-1.5">
            Sign in to manage catalog, stock levels, and WhatsApp enquiries.
          </p>
        </div>

        {/* Demo Credentials Quick Pill */}
        <div className="mb-6 p-3 bg-emerald-950/60 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <strong>Demo Credentials:</strong> User: <code className="text-white font-mono">admin</code> / Pass: <code className="text-white font-mono">admin123</code>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all mt-6 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[11px] text-gray-500 border-t border-gray-800 pt-4">
          🔐 Protected Admin Gateway • Unauthorized access is logged and restricted.
        </div>
      </div>
    </div>
  );
}
