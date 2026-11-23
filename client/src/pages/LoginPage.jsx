import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Store,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  HelpCircle,
  UserPlus,
  LogIn,
  ChevronDown,
  KeyRound,
  RefreshCw,
  Clock,
  X
} from 'lucide-react';
import RoyalLogo from '../components/RoyalLogo';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', length: 9 },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', length: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', length: 10 }
];

/**
 * Validate strong password criteria:
 * 1. Total at least 8 characters
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one number (0-9)
 * 4. At least one special character (!@#$%^&*...)
 */
export function checkPasswordCriteria(pwd = '') {
  const minLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  return {
    minLength,
    hasUpper,
    hasNumber,
    hasSpecial,
    isValid: minLength && hasUpper && hasNumber && hasSpecial
  };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error, info, warning } = useToast();
  const {
    customerLogin,
    customerRegister,
    verifyForgotPasswordMobile,
    changePasswordDirect,
    isCustomerLoggedIn
  } = useAuth();

  // Redirect parameter: if user tried ordering without being logged in
  const isOrderRedirect = searchParams.get('redirect') === 'order';
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  // 2-Second Small Popup: triggers on redirect to order and auto-hides after exactly 2000ms
  useEffect(() => {
    if (isOrderRedirect) {
      setShowOrderPopup(true);
      const timer = setTimeout(() => {
        setShowOrderPopup(false);
      }, 2000); // exactly 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isOrderRedirect]);

  // Form State
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState(() => {
    return localStorage.getItem('roja_remembered_mobile') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasInteractedPassword, setHasInteractedPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('roja_remember_me') === 'true';
  });

  // UI & Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ==========================================
  // FORGOT PASSWORD MODAL STATE (Multi-Step)
  // Step 1: Enter mobile number & verify against DB
  // Step 2: Enter OTP
  // Step 3: Enter new password with strict validation
  // ==========================================
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotCountryCode, setForgotCountryCode] = useState('+91');
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [hasInteractedForgotPwd, setHasInteractedForgotPwd] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotDebugOtp, setForgotDebugOtp] = useState('');

  // ==========================================
  // CREATE NEW ACCOUNT MODAL STATE
  // Validates duplicate mobile against DB & strict password validation
  // ==========================================
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerCountryCode, setRegisterCountryCode] = useState('+91');
  const [registerMobile, setRegisterMobile] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [hasInteractedRegisterPwd, setHasInteractedRegisterPwd] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Selected Country details
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  // Real-time password criteria
  const passwordCriteria = checkPasswordCriteria(password);
  const registerPwdCriteria = checkPasswordCriteria(registerPassword);
  const forgotPwdCriteria = checkPasswordCriteria(forgotNewPassword);

  // Mobile number input handler (allow digits only)
  const handleMobileChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const maxLen = selectedCountry.length;
    const truncated = rawVal.slice(0, maxLen);
    setMobileNumber(truncated);

    if (errors.mobile) {
      setErrors((prev) => ({ ...prev, mobile: null }));
    }
  };

  // Password change handler
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setHasInteractedPassword(true);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!mobileNumber.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (mobileNumber.length !== selectedCountry.length) {
      newErrors.mobile = `Please enter a valid ${selectedCountry.length}-digit mobile number`;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      setHasInteractedPassword(true);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Login Submit Handler (Role-Based Access Control)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      error('Please correct the highlighted errors');
      return;
    }

    setIsLoading(true);

    // Save or clear Remember Me
    if (rememberMe) {
      localStorage.setItem('roja_remembered_mobile', mobileNumber);
      localStorage.setItem('roja_remember_me', 'true');
    } else {
      localStorage.removeItem('roja_remembered_mobile');
      localStorage.removeItem('roja_remember_me');
    }

    try {
      const data = await customerLogin(mobileNumber.trim(), password, countryCode);

      // Role-Based Access Control: Admin vs Customer
      if (data.role === 'admin' || data.user?.role === 'admin') {
        success('Welcome, Administrator! Opening Admin Dashboard...');
        navigate('/admin/dashboard');
        return;
      }

      success(`Welcome back! You are now logged in as ${countryCode} ${mobileNumber}`);

      // If came from order flow, redirect back to order/catalog
      if (isOrderRedirect) {
        navigate('/?reopen_cart=true');
      } else {
        navigate('/');
      }
    } catch (err) {
      error(err.message || 'Invalid mobile number or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Fills
  const handleAdminDemoFill = () => {
    setCountryCode('+91');
    setMobileNumber('9876543210');
    setPassword('admin123');
    setHasInteractedPassword(true);
    setErrors({});
    info('Admin credentials loaded (9876543210 / admin123)');
  };

  const handleQuickDemoFill = () => {
    setCountryCode('+91');
    setMobileNumber('9876543210');
    setPassword('admin123');
    setHasInteractedPassword(true);
    setErrors({});
    info('Credentials loaded (9876543210 / admin123)');
  };

  // ==========================================
  // FORGOT PASSWORD HANDLERS (NO OTP NEEDED)
  // Step 1: Verify mobile number exists in database
  // Step 2: Open set new password page and update directly in database
  // ==========================================
  const handleForgotStep1Submit = async (e) => {
    e.preventDefault();
    if (!forgotMobile || forgotMobile.trim().length < 8) {
      error('Please enter a valid registered mobile number');
      return;
    }

    setForgotLoading(true);
    try {
      const data = await verifyForgotPasswordMobile(forgotMobile.trim(), forgotCountryCode);
      success(data.message || 'Mobile number verified! Please enter your new password.');
      setForgotStep(2); // Directly open new password step! No OTP!
    } catch (err) {
      error(err.message || 'This mobile number is not registered. Please create a new account.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotStep2Submit = async (e) => {
    e.preventDefault();
    setHasInteractedForgotPwd(true);

    if (!forgotPwdCriteria.isValid) {
      error('Password does not meet the required rules');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      error('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await changePasswordDirect(
        forgotMobile.trim(),
        forgotNewPassword,
        forgotCountryCode
      );
      success(res.message || 'Password changed successfully! You can now login.');

      // Pre-fill login form with new credentials
      setMobileNumber(forgotMobile.trim());
      setPassword(forgotNewPassword);
      setHasInteractedPassword(true);
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      error(err.message || 'Failed to update password');
    } finally {
      setForgotLoading(false);
    }
  };

  // ==========================================
  // REGISTRATION HANDLER (NO DUPLICATE NUMBERS)
  // ==========================================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setHasInteractedRegisterPwd(true);

    if (!registerName || !registerName.trim()) {
      error('Please enter your full name');
      return;
    }

    if (!registerMobile || registerMobile.trim().length !== 10) {
      error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!registerPwdCriteria.isValid) {
      error('Password does not meet the required rules');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      error('Passwords do not match');
      return;
    }

    setRegisterLoading(true);
    try {
      await customerRegister(
        registerName.trim(),
        registerMobile.trim(),
        registerPassword,
        registerCountryCode
      );
      success('Account created successfully! Welcome to Roja Traders.');
      setShowRegisterModal(false);

      if (isOrderRedirect) {
        navigate('/?reopen_cart=true');
      } else {
        navigate('/');
      }
    } catch (err) {
      error(err.message || 'Mobile number already registered');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between relative">
      {/* ======================================================== */}
      {/* 2-SECOND SMALL POPUP: When redirected from Order on WhatsApp */}
      {/* ======================================================== */}
      {showOrderPopup && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce duration-300 pointer-events-none">
          <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-2.5 text-xs font-bold text-center">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
            <Sparkles className="w-4 h-4 text-[#25D366]" />
            <span>Please login or create an account</span>
            <span className="text-[10px] text-emerald-300 font-normal border-l border-white/20 pl-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 2s
            </span>
          </div>
        </div>
      )}

      {/* Top Mobile Bar (Visible on mobile only) */}
      <div className="lg:hidden p-4 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Back to Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <RoyalLogo className="w-7 h-7" />
          <span className="text-sm font-black text-slate-900 tracking-tight">Roja Traders</span>
        </div>
      </div>

      {/* Main Split Screen Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* ======================================================== */}
        {/* LEFT SIDE: Premium E-Commerce Showcase (Desktop) */}
        {/* ======================================================== */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-[#06241a] via-[#0b3324] to-[#04160f] relative overflow-hidden flex-col justify-between p-10 xl:p-14 text-white">
          {/* Subtle decorative glowing background orbs */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-[#25D366]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-12 right-12 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Side Header */}
          <div className="relative z-10 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white backdrop-blur-md transition-all hover:-translate-x-0.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Back to Store</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              <span>Direct WhatsApp Commerce</span>
            </div>
          </div>

          {/* Left Side Hero Centerpiece */}
          <div className="relative z-10 max-w-xl my-auto py-8">
            <div className="flex items-center gap-3.5 mb-6">
              <RoyalLogo className="w-14 h-14 drop-shadow-xl" />
              <div>
                <h3 className="text-xl font-black text-white tracking-wide">ROJA TRADERS</h3>
                <p className="text-xs text-emerald-300 font-semibold tracking-wider uppercase">
                  Wholesale & Everyday Provisions
                </p>
              </div>
            </div>

            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black tracking-tight leading-[1.18] text-white mb-4">
              Everything You Love,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-emerald-300 to-teal-200">
                Just One Click Away.
              </span>
            </h1>

            <p className="text-sm xl:text-base text-slate-300 font-normal leading-relaxed mb-8 max-w-lg">
              Discover products, shop easily, and connect with us through WhatsApp. Authentic groceries,
              daily essentials, and cleaning items delivered with trust.
            </p>

            {/* Shopping Feature Cards */}
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-white/[0.1] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center shrink-0 text-[#25D366]">
                  <MessageCircle className="w-5 h-5 fill-[#25D366]/20 stroke-[#25D366]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Direct WhatsApp Inquiries</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-normal">
                    Select products, confirm stock, and communicate directly with our store managers on WhatsApp.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-white/[0.1] transition-all">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-teal-300">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Verified Wholesale & Retail Stock</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-normal">
                    Transparent pricing and live stock indicators with guaranteed authentic quality products.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md flex items-start gap-3.5 hover:bg-white/[0.1] transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zero Payment Gateway Hassle</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-normal">
                    No card entry required. Enjoy direct UPI, cash on pickup, or verified bank transfer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Side Footer Stats */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">★★★★★</span>
              <span>4.9 / 5.0 Customer Rating</span>
            </div>
            <div>
              <span className="text-white font-semibold">100% Genuine Quality</span>
            </div>
            <div>
              <span className="text-emerald-300 font-semibold">Trusted Local Store</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT SIDE: Clean White Login Card */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 bg-[#F8FAFC]">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            {/* Header: Brand Logo & Title */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-2xs mb-3">
                <RoyalLogo className="w-11 h-11" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight">
                Welcome Back!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                Login to continue shopping with us.
              </p>
            </div>

            {/* Role-Based Quick Demo Fill Helper */}
            <div className="mb-5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>Role-Based Demo:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAdminDemoFill}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    title="Fill Admin Credentials"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                    title="Fill Credentials"
                  >
                    <span>Customer</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 pl-5.5">
                Admin mobile redirects to <strong>Admin Dashboard</strong>. Customer mobile accesses store.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4 sm:space-y-5">
              {/* Country Code & Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <div className="relative shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setMobileNumber('');
                        setErrors((prev) => ({ ...prev, mobile: null }));
                      }}
                      className="h-11 sm:h-12 pl-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366] cursor-pointer transition-all"
                      title="Select Country Code"
                    >
                      {COUNTRY_CODES.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.flag} {item.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Mobile Input Field */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={mobileNumber}
                      onChange={handleMobileChange}
                      placeholder={`Enter ${selectedCountry.length}-digit mobile`}
                      className={`w-full h-11 sm:h-12 pl-10 pr-3.5 bg-slate-50 focus:bg-white border ${
                        errors.mobile
                          ? 'border-rose-400 focus:ring-rose-200'
                          : 'border-slate-200 focus:border-[#25D366] focus:ring-[#25D366]/20'
                      } rounded-xl text-xs sm:text-sm text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all font-mono`}
                    />
                  </div>
                </div>

                {errors.mobile && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.mobile}</span>
                  </p>
                )}
              </div>

              {/* Password Input with Dynamic Small Validation Rules Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    className={`w-full h-11 sm:h-12 pl-10 pr-11 bg-slate-50 focus:bg-white border ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#25D366] focus:ring-[#25D366]/20'
                    } rounded-xl text-xs sm:text-sm text-[#1F2937] placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all`}
                  />
                  {/* Show/Hide Password Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#25D366] focus:ring-[#25D366]/30 cursor-pointer accent-[#25D366]"
                  />
                  <span className="text-xs font-semibold text-slate-600">Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotStep(1);
                    setForgotMobile(mobileNumber);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20be5b] active:bg-[#1caa51] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] cursor-pointer disabled:opacity-75 disabled:pointer-events-none mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Create New Account Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterMobile(mobileNumber);
                      setShowRegisterModal(true);
                    }}
                    className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Create New Account
                  </button>
                </p>
              </div>
            </form>

            {/* Bottom Divider & Store Support */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#25D366]" />
                Secure & Verified
              </span>
              <Link
                to="/contact"
                className="text-slate-500 hover:text-emerald-700 font-medium hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Need Help?
              </Link>
            </div>
          </div>

          {/* Terms & Privacy Policy (Bottom requirement) */}
          <div className="text-center mt-6 text-[11px] text-slate-400 max-w-sm leading-relaxed">
            By continuing, you agree to Roja Traders'{' '}
            <Link to="/contact" className="underline hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/contact" className="underline hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FORGOT PASSWORD MODAL (Step 1: Check DB -> Step 2: Set New Password - NO OTP!) */}
      {/* ======================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#25D366]" />
                <h3 className="text-base font-black text-slate-900">
                  {forgotStep === 1 && 'Forgot Password – Verify Mobile'}
                  {forgotStep === 2 && 'Set New Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Enter mobile number & verify against database (No OTP) */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1Submit} className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered mobile number. We will check our database and open the new password page directly.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={forgotCountryCode}
                      onChange={(e) => setForgotCountryCode(e.target.value)}
                      className="h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={forgotMobile}
                      onChange={(e) => setForgotMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-[#25D366] hover:bg-[#20be5b] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                >
                  {forgotLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Checking Database...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Mobile & Set Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Directly change password with strict validation (NO OTP!) */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotStep2Submit} className="space-y-4">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mobile Verified: {forgotCountryCode} {forgotMobile}</span>
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Please create your new password below.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        setHasInteractedForgotPwd(true);
                      }}
                      className="w-full h-10 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                    >
                      {showForgotNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Dynamic Small Password Rules Box */}
                  {hasInteractedForgotPwd && !forgotPwdCriteria.isValid && (
                    <div className="mt-2 p-2 bg-rose-50 border border-rose-200/80 rounded-xl space-y-1 text-[11px] animate-fadeIn">
                      <p className="font-bold text-rose-700 text-[10px] uppercase">
                        Password Rules (Must satisfy all):
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className={forgotPwdCriteria.minLength ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                          {forgotPwdCriteria.minLength ? '✓' : '✕'} 8+ Characters
                        </span>
                        <span className={forgotPwdCriteria.hasUpper ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                          {forgotPwdCriteria.hasUpper ? '✓' : '✕'} 1 Uppercase (A-Z)
                        </span>
                        <span className={forgotPwdCriteria.hasNumber ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                          {forgotPwdCriteria.hasNumber ? '✓' : '✕'} 1 Number (0-9)
                        </span>
                        <span className={forgotPwdCriteria.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                          {forgotPwdCriteria.hasSpecial ? '✓' : '✕'} 1 Special Char
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                    required
                  />
                  {forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#20be5b] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save New Password & Login</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE NEW ACCOUNT MODAL (NO DUPLICATE NUMBERS IN DB) */}
      {/* ======================================================== */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#25D366]" />
                <h3 className="text-base font-black text-slate-900">Create New Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Register with your mobile number to enjoy 1-tap WhatsApp orders and transparent stock details.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mobile Number (Unique) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={registerCountryCode}
                    onChange={(e) => setRegisterCountryCode(e.target.value)}
                    className="h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={registerMobile}
                    onChange={(e) => setRegisterMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="Create strong password"
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      setHasInteractedRegisterPwd(true);
                    }}
                    className="w-full h-10 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                  >
                    {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Dynamic Small Password Rules Box */}
                {hasInteractedRegisterPwd && !registerPwdCriteria.isValid && registerPassword.length > 0 && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-200/80 rounded-xl space-y-1 text-[11px] animate-fadeIn">
                    <p className="font-bold text-rose-700 text-[10px] uppercase">
                      Password Requirements:
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className={registerPwdCriteria.minLength ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {registerPwdCriteria.minLength ? '✓' : '✕'} 8+ Characters
                      </span>
                      <span className={registerPwdCriteria.hasUpper ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {registerPwdCriteria.hasUpper ? '✓' : '✕'} 1 Uppercase (A-Z)
                      </span>
                      <span className={registerPwdCriteria.hasNumber ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {registerPwdCriteria.hasNumber ? '✓' : '✕'} 1 Number (0-9)
                      </span>
                      <span className={registerPwdCriteria.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                        {registerPwdCriteria.hasSpecial ? '✓' : '✕'} 1 Special Char
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 focus:border-[#25D366]"
                  required
                />
                {registerConfirmPassword && registerPassword !== registerConfirmPassword && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20be5b] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 mt-2"
              >
                {registerLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Checking Database & Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
