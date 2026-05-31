import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMail, FiShield, FiCalendar, FiLogOut, FiCheckCircle } from 'react-icons/fi';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          My Profile
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your account parameters, workspace credentials, and active permissions.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar Representation */}
        <div className="w-24 h-24 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center text-3xl font-bold uppercase shrink-0">
          {user?.name?.slice(0, 2) || 'US'}
        </div>

        {/* User Details Details */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{user?.name || 'Loading Name...'}</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 capitalize">
              {user?.role || 'Staff'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6 text-left">
            <div className="flex items-center gap-3">
              <FiMail className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
              <div className="min-w-0">
                <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate block">{user?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FiShield className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
              <div className="min-w-0">
                <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Access Role</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize block">{user?.role || 'Staff'} Access</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FiCalendar className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
              <div className="min-w-0">
                <span className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Member Since</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions / Role Guidelines */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h4 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FiShield size={18} className="text-sky-500" /> Active Workspace Permissions
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Your access level grants the following operational capabilities within StockPilot:
        </p>

        {user?.role === 'admin' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> Manage catalog products (Create, Read, Update, Delete)
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> Edit price thresholds and SKU quantities
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> Run POS terminal and issue tax invoices
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> Access full sales history registry and download PDFs
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> View registered customers CRM files
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> Run POS terminal and checkout customer bills
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> View current inventory stock limits and brands
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> View invoices sales log and print receipts
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500 shrink-0" size={16} /> View customers loyalty CRM parameters
            </div>
          </div>
        )}
      </div>

      {/* Account Settings / Sign Out Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-500 hover:text-white dark:bg-rose-950/20 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 px-6 py-3 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-[0.98]"
        >
          <FiLogOut size={16} /> Sign Out of Account
        </button>
      </div>
    </div>
  );
};

export default Profile;
