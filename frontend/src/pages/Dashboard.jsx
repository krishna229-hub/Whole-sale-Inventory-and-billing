import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);
import {
  FiBox,
  FiTrendingUp,
  FiAlertTriangle,
  FiFileText,
  FiUsers,
  FiArrowRight
} from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await API.get('/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.stats);
          setRecentTransactions(response.data.recentTransactions);
          setChartData(response.data.monthlySales);
        }
      } catch (error) {
        showError('Failed to fetch dashboard metrics.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showError]);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Format currency helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalSales || 0),
      icon: FiTrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      description: 'Accumulated gross sales'
    },
    {
      title: 'Active Inventory Items',
      value: stats?.totalProducts || 0,
      icon: FiBox,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      description: 'Different products registered'
    },
    {
      title: 'Invoices Issued',
      value: stats?.totalInvoices || 0,
      icon: FiFileText,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      description: 'Total completed sales'
    },
    {
      title: 'Registered Customers',
      value: stats?.totalCustomers || 0,
      icon: FiUsers,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      description: 'Wholesale buyer profiles'
    },
    {
      title: 'Low Stock Warnings',
      value: stats?.lowStockProducts || 0,
      icon: FiAlertTriangle,
      color: stats?.lowStockProducts > 0 
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450 animate-pulse' 
        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      description: 'Products with stock < 5 units'
    }
  ];

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          Dashboard Overview
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          Real-time metrics, transactions summary, and business analytics.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl shrink-0 ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-slate-800 dark:text-white truncate block">
                  {card.value}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                  {card.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Invoices Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Revenue Performance</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monthly wholesale sales curve</p>
            </div>
          </div>
          <div className="h-80 w-full relative">
            {chartData && chartData.length > 0 ? (
              <Line 
                data={{
                  labels: chartData.map(d => d.month),
                  datasets: [
                    {
                      label: 'Revenue',
                      data: chartData.map(d => d.sales),
                      fill: true,
                      backgroundColor: 'rgba(14, 165, 233, 0.15)',
                      borderColor: '#0ea5e9',
                      borderWidth: 2.5,
                      tension: 0.4,
                      pointRadius: chartData.length <= 3 ? 6 : 3,
                      pointHoverRadius: 8,
                      pointBackgroundColor: '#0ea5e9',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: '#94a3b8', font: { size: 11 } }
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(148, 163, 184, 0.1)', drawBorder: false },
                      ticks: { 
                        color: '#94a3b8', 
                        font: { size: 11 },
                        callback: (v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
                      }
                    }
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      titleFont: { size: 12 },
                      bodyFont: { size: 12 },
                      padding: 10,
                      displayColors: false,
                      callbacks: {
                        label: (context) => `Revenue: ₹${context.parsed.y.toLocaleString('en-IN')}`
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No sales data available</div>
            )}
          </div>
        </div>

        {/* Recent Transactions Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Latest sales orders processed</p>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1 hover:underline transition-all"
            >
              View All <FiArrowRight />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto space-y-4 pr-1">
            {recentTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm py-12">
                No invoices recorded yet.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      {tx.customer?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded-sm">
                        {tx.invoiceNumber}
                      </span>
                      <span className="text-xxs text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                      {formatCurrency(tx.totalAmount)}
                    </span>
                    <span className="text-xxs text-slate-400">{tx.paymentMethod}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
