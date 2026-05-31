import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import Spinner from '../components/Spinner';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const { showSuccess, showError } = useContext(ToastContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear validation error when editing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validate = () => {
    const tempErrors = {};
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!formData.email) {
      tempErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const result = await login(formData.email, formData.password);
    setSubmitting(false);

    if (result.success) {
      showSuccess('Welcome back to StockPilot!');
      navigate('/dashboard');
    } else {
      showError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-sky-500/5 dark:bg-sky-500/10 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] animate-pulse"></div>

      {/* Glass Panel Container */}
      <div className="w-full max-w-md p-8 sm:p-10 mx-4 z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl rounded-2xl transition-all duration-200">
        <div className="text-center mb-8 select-none caret-transparent">
          <img
            src="/invoice-icon.png"
            alt="StockPilot Logo"
            className="block mx-auto w-12 h-12 rounded-xl object-cover shadow-lg shadow-sky-500/20 mb-4 pointer-events-none"
          />
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">StockPilot</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Wholesale Inventory & Billing Control</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border ${
                errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all`}
            />
            {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">{errors.email}</p>}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border ${
                errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
              } text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all`}
            />
            {errors.password && <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Spinner size="sm" color="white" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
