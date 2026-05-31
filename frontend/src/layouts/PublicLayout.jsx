import React, { useContext } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiSun, FiMoon, FiUser, FiHome, FiLock, FiLogOut } from 'react-icons/fi';

const PublicLayout = () => {
  const { user, theme, toggleTheme, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 ${
      isActive
        ? 'bg-sky-500/10 text-sky-500 dark:bg-sky-500/15'
        : 'text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  const registerLinkClass = ({ isActive }) =>
    `text-sm font-bold px-4.5 py-2 rounded-xl transition-all active:scale-[0.97] ${
      isActive
        ? 'bg-sky-655 text-white shadow-inner bg-sky-600'
        : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/10 hover:shadow-sky-500/20'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-2.5 select-none caret-transparent">
            <img
              src="/invoice-icon.png"
              alt="StockPilot Logo"
              className="w-8.5 h-8.5 rounded-lg object-cover shadow-md shadow-sky-500/10 pointer-events-none"
            />
            <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-wide">
              StockPilot
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-6">
            <NavLink to="/" className={navLinkClass} end>
              <FiHome size={15} /> Home
            </NavLink>

            {user ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  <FiUser size={15} /> Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FiLogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  <FiLock size={14} /> Sign In
                </NavLink>
                <NavLink to="/signup" className={navLinkClass}>
                  Register
                </NavLink>
              </>
            )}

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-lg transition-colors focus:outline-hidden cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex items-center gap-2.5 select-none caret-transparent">
              <img
                src="/invoice-icon.png"
                alt="StockPilot Logo"
                className="w-8.5 h-8.5 rounded-lg object-cover shadow-md shadow-sky-500/10 pointer-events-none"
              />
              <span className="font-extrabold text-lg text-slate-800 dark:text-white tracking-wide">
                StockPilot
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
              <Link to="/" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Home</Link>
              <Link to="/login" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Sign In</Link>
              <Link to="/signup" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Register</Link>
              {user && <Link to="/profile" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Profile</Link>}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <p>&copy; {new Date().getFullYear()} StockPilot Ltd. All rights reserved. Wholesale Inventory & Billing POS.</p>
            <p>Designed for premium, lightning-fast business operations.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
