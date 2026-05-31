import React, { useState, useContext } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import {
  FiHome,
  FiShoppingBag,
  FiBox,
  FiFileText,
  FiUsers,
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiChevronLeft,
  FiChevronRight,
  FiUser
} from 'react-icons/fi';

const DashboardLayout = () => {
  const { user, logout, theme, toggleTheme } = useContext(AuthContext);
  const { showInfo } = useContext(ToastContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'New Bill (POS)', path: '/billing', icon: FiShoppingBag },
    { name: 'Inventory', path: '/inventory', icon: FiBox },
    { name: 'Sales History', path: '/sales', icon: FiFileText },
    { name: 'Customers', path: '/customers', icon: FiUsers }
  ];

  const handleLogout = () => {
    logout();
    showInfo('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-45 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden select-none caret-transparent">
            <img
              src="/invoice-icon.png"
              alt="StockPilot Logo"
              className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-md shadow-sky-500/10 pointer-events-none"
            />
            {isSidebarOpen && (
              <span className="font-bold text-lg text-slate-800 dark:text-white tracking-wide shrink-0">
                StockPilot
              </span>
            )}
          </div>
          {/* Close button for Mobile screen */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-150 group
                  ${
                    active
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
              >
                <Icon
                  size={20}
                  className={`${
                    active
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                />
                {isSidebarOpen && <span>{item.name}</span>}
                {!isSidebarOpen && (
                  <span className="absolute left-24 px-2 py-1 rounded bg-slate-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-sm whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg"
            >
              <FiMenu size={20} />
            </button>

            {/* Sidebar toggle desktop */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
            </button>

            <h1 className="text-lg font-semibold text-slate-800 dark:text-white capitalize hidden sm:block">
              {location.pathname.substring(1) === 'sales' ? 'Sales History' : location.pathname.substring(1) || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-lg transition-colors focus:outline-hidden cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full focus:outline-hidden transition-colors cursor-pointer text-left"
                title="Account menu"
              >
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold uppercase border border-slate-300 dark:border-slate-700">
                  {user?.name?.slice(0, 2) || 'US'}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">
                    {user?.role || 'Staff'}
                  </span>
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50 animate-slide-in">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {user?.name || 'User'}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 capitalize mt-1">
                        {user?.role || 'Staff'}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all"
                      >
                        <FiUser size={16} />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all w-full text-left cursor-pointer"
                      >
                        <FiLogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* System Clock Widget (Clean Header Metric) */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">System Date</span>
              <span className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page Outlet */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="flex-grow">
            <Outlet />
          </div>
          {/* Workspace Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            <p>&copy; {new Date().getFullYear()} StockPilot Ltd. All rights reserved. Wholesale Inventory & Billing POS.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
