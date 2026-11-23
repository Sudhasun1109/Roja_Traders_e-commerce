import React, { useState, useEffect } from 'react';
import { X, Phone, ShieldCheck, ArrowRight, RefreshCw, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OtpModal() {
  const { isOtpModalOpen, closeOtpModal, requestOtp, confirmOtp } = useAuth();
  const { success, error } = useToast();

  const [step, setStep] = useState(1); // 1: Enter mobile & name, 2: Enter OTP
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState('');

  // Reset on open/close
  useEffect(() => {
    if (isOtpModalOpen) {
      setStep(1);
      setOtp('');
      setDevOtpHint('');
    }
  }, [isOtpModalOpen]);

  // Countdown timer for resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOtpModalOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.trim().length < 8) {
      error('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      const data = await requestOtp(mobileNumber.trim(), countryCode);
      success('Verification code sent to your phone!');
      setStep(2);
      setResendTimer(60);
      if (data?.debugOtp) {
        setDevOtpHint(data.debugOtp);
        // Pre-fill for convenience
        setOtp(data.debugOtp);
      }
    } catch (err) {
      error(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      error('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      await confirmOtp(mobileNumber.trim(), otp.trim(), name.trim(), countryCode);
      success('Mobile number verified successfully! You are logged in.');
    } catch (err) {
      error(err.message || 'Incorrect or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    try {
      const data = await requestOtp(mobileNumber.trim(), countryCode);
      success('A new verification code has been sent!');
      setResendTimer(60);
      if (data?.debugOtp) {
        setDevOtpHint(data.debugOtp);
        setOtp(data.debugOtp);
      }
    } catch (err) {
      error(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header background banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <button
            onClick={closeOtpModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Phone className="w-7 h-7 text-emerald-200" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Customer Verification</h3>
          <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
            Log in or verify your mobile number to enquire and place orders via WhatsApp
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Your Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name (e.g. Sudhasun)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  WhatsApp Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 px-2 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  We'll verify your number to dispatch your order directly to our WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer mt-4"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <span className="text-xs text-gray-500">Code sent to:</span>
                <p className="font-semibold text-gray-900 font-mono">
                  {countryCode} {mobileNumber}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-emerald-600 hover:underline mt-0.5"
                >
                  Change mobile number
                </button>
              </div>

              {/* Dev mode instant hint pill */}
              {devOtpHint && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Demo / Dev OTP:</strong>{' '}
                    <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold tracking-widest text-emerald-900">
                      {devOtpHint}
                    </code>{' '}
                    (Auto-filled for testing)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>Didn't receive code?</span>
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-emerald-600 font-medium hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer mt-4"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
            🔒 Safe & Secure. We only use your mobile number to route orders directly to WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}
