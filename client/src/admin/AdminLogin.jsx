import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Phone,
  User,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Store,
  Eye,
  EyeOff,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RoyalLogo from '../components/RoyalLogo';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8 },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', length: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', length: 10 }
];

export default function AdminLogin() {
  const { adminLogin, isAdminLoggedIn } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Mode: 'mobile' (default) or 'username'
  const [loginMode, setLoginMode] = useState('mobile');

  // Form State
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect cleanly via component return
  if (isAdminLoggedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleMobileChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const selected = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];
    setMobileNumber(rawVal.slice(0, selected.length));
  };

  const handleDemoFill = () => {
    setLoginMode('mobile');
    setCountryCode('+91');
    setMobileNumber('9876543210');
    setPassword('admin123');
    info('Admin mobile credentials loaded (9876543210 / admin123)');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const identifier = loginMode === 'mobile' ? mobileNumber.trim() : username.trim();

    if (!identifier) {
      error(loginMode === 'mobile' ? 'Please enter your mobile number' : 'Please enter your username');
      return;
    }

    if (!password) {
      error('Please enter your password');
      return;
    }

    if (loginMode === 'mobile' && mobileNumber.length < 8) {
      error('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      await adminLogin(identifier, password, countryCode);
      success('Welcome back, Administrator!');
      navigate('/admin/dashboard');
    } catch (err) {
      error(err.message || 'Invalid admin credentials or access denied');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

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

      <div className="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <RoyalLogo className="w-16 h-16 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-white tracking-tight">Roja Traders</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mt-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Console (RBAC)</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Secure Role-Based Access for Administrators
          </p>
        </div>

        {/* Mode Selector Tabs: Mobile Number (Primary) vs Username */}
        <div className="grid grid-cols-2 p-1 bg-gray-800/80 rounded-2xl mb-5 border border-gray-700/60">
          <button
            type="button"
            onClick={() => setLoginMode('mobile')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'mobile'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile Number</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('username')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'username'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Username</span>
          </button>
        </div>

        {/* Demo Credentials Quick Pill */}
        <div className="mb-5 p-3 bg-emerald-950/60 border border-emerald-500/25 rounded-2xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Admin Demo:</span>{' '}
              <code className="text-emerald-300 font-mono">9876543210</code> /{' '}
              <code className="text-emerald-300 font-mono">admin123</code>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/40 transition-all cursor-pointer"
          >
            Auto-fill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === 'mobile' ? (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Admin Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                {/* Country Code */}
                <div className="relative shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-11 pl-2.5 pr-6 bg-gray-800 border border-gray-700 rounded-xl text-xs font-bold text-white appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.flag} {item.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Mobile Input */}
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    placeholder={`Enter ${selectedCountry.length}-digit mobile`}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Admin Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username (e.g. admin)"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all mt-6 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In as Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-gray-500 border-t border-gray-800 pt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Based Access Control • Verified Administrator Gateway</span>
        </div>
      </div>
    </div>
  );
}
