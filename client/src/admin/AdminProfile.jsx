import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  User,
  Phone,
  CheckCircle2,
  Save,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8 },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', length: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', length: 10 }
];

export default function AdminProfile() {
  const { adminUser, updateAdminProfileData } = useAuth();
  const { success, error, info } = useToast();

  // Profile Edit State
  const [username, setUsername] = useState(adminUser?.username || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Fetch full admin profile on mount
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const res = await api.get('/admin/profile');
        if (res.data && res.data.admin) {
          const adm = res.data.admin;
          setUsername(adm.username || '');
          if (adm.mobile_number) {
            // Parse country code if present
            const matchedCode = COUNTRY_CODES.find((c) => adm.mobile_number.startsWith(c.code));
            if (matchedCode) {
              setCountryCode(matchedCode.code);
              setMobileNumber(adm.mobile_number.slice(matchedCode.code.length));
            } else {
              setMobileNumber(adm.mobile_number.replace(/^\+91/, ''));
            }
          }
        }
      } catch (err) {
        // Fallback to local adminUser
        if (adminUser) {
          setUsername(adminUser.username || '');
          if (adminUser.mobile_number) {
            setMobileNumber(adminUser.mobile_number.replace(/^\+91/, ''));
          }
        }
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [adminUser]);

  const handleMobileChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const selected = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];
    setMobileNumber(rawVal.slice(0, selected.length));
  };

  // Submit Profile Changes (Username & Mobile Number)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username || !username.trim()) {
      error('Administrator username/name cannot be empty');
      return;
    }

    if (!mobileNumber || mobileNumber.trim().length < 8) {
      error('Please enter a valid mobile number');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.put('/admin/profile', {
        username: username.trim(),
        mobileNumber: mobileNumber.trim(),
        countryCode
      });

      if (res.data && res.data.admin) {
        updateAdminProfileData(res.data.admin, res.data.token);
      }
      success(res.message || 'Admin profile updated! Your new mobile number is saved.');
    } catch (err) {
      error(err.message || 'Failed to update admin profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      error('Please provide both current and new passwords');
      return;
    }

    if (newPassword.length < 6) {
      error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/admin/change-password', {
        currentPassword,
        newPassword
      });
      success('Admin password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Profile & Security</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your administrator credentials, contact mobile number, and account password.
        </p>
      </div>

      {/* Account Info Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-xs">
            {username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>{username || 'Admin'}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold uppercase">
                {adminUser?.role || 'Administrator'}
              </span>
            </h3>
            <p className="text-gray-400 font-mono mt-0.5">
              Login Mobile: {countryCode} {mobileNumber || '9876543210'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[11px] border border-emerald-200/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Active Protected Session (RBAC)
        </span>
      </div>

      {/* SECTION 1: Edit Profile & Mobile Number */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Edit Administrator Details</span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">
            Changes apply to your login credentials
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username / Admin Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Admin Username / Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Sudhasun or admin"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Admin Mobile Number (Editable) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Login Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                {/* Country Code */}
                <div className="relative shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-9.5 pl-2.5 pr-6 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.flag} {item.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Number Input */}
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    placeholder={`Enter ${selectedCountry.length}-digit mobile`}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice:</strong> Updating your mobile number will change the mobile number used to log in at the <strong>Login Page</strong>. Ensure you have access to this number.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile || loadingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile & Mobile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Change Password */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
          <KeyRound className="w-4 h-4 text-emerald-600" />
          <span>Change Admin Password</span>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Current Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
