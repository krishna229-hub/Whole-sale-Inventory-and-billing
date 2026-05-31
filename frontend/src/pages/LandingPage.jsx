import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiArrowRight, FiBox, FiShoppingBag, FiUsers, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

const LandingPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="space-y-20 pb-20 animate-slide-in">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-20 md:pt-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 dark:bg-sky-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-100/80 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
            Version 1.0 Live
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-white leading-[1.1]">
            Next-Gen Wholesale <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-600">
              Inventory & Billing POS
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            StockPilot streamlines wholesale operations. Catalog management, rapid checkout, automated stock adjustments, GST tax computation, and live revenue charts all in one place.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                Enter Dashboard <FiArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  Get Started Free <FiArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-bold text-base transition-all cursor-pointer"
                >
                  Demo Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Grid Highlights Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
            Designed for Speed and Accuracy
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Engineered with modern tools to simplify commercial operations and eliminate ledger inconsistencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
              <FiShoppingBag size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Checkout Terminal</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Create orders in seconds. Instantly calculate GST rates, handle stock boundaries, print thermal receipts, and export fully detailed PDF files.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 flex items-center justify-center">
              <FiBox size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Active Inventory</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Track stock levels, record brand lines and categorizations. Receive immediate indicators when inventory drops below critical limits.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <FiTrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Revenue Charts</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Audit operational metrics, gross income channels, and register transactions in real time. Gain clean chart visualizations.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <FiUsers size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Customer CRM</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Review individual profiles. Track aggregate customer expenditures, calculate invoice history, and understand client loyalty rankings.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Checklist Section */}
      <section className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/50 py-16">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
              Enterprise Grade Operations, Accessible Locally
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              StockPilot offers robust data synchronization and locks that prevent invalid transactions, ensuring that staff checkouts never duplicate items or skip validations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="text-sky-500 mt-0.5 shrink-0" size={18} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">JWT Token Security</span>
            </div>
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="text-sky-500 mt-0.5 shrink-0" size={18} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role-Based Guarding</span>
            </div>
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="text-sky-500 mt-0.5 shrink-0" size={18} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Auto-Reducing Stocks</span>
            </div>
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="text-sky-500 mt-0.5 shrink-0" size={18} />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">PDF Invoice Downloads</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box Section */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-sky-500 dark:bg-sky-600 rounded-3xl p-8 md:p-12 text-center text-white space-y-6 shadow-xl shadow-sky-500/10">
          <h2 className="text-2xl md:text-4xl font-extrabold">Ready to Optimize Your Warehouse?</h2>
          <p className="text-sm md:text-base text-sky-100 max-w-xl mx-auto font-medium">
            Register your wholesale brand account now and start processing invoice sheets immediately.
          </p>
          <div className="pt-2">
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="inline-flex items-center gap-2 bg-white text-sky-600 hover:bg-sky-50 active:scale-[0.98] px-8 py-3.5 rounded-xl font-bold text-base transition-all shadow-md"
            >
              {user ? 'Enter Workspace' : 'Create Account Now'} <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
