const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core KPIs
    const totalProducts = await Product.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    
    // Low stock items (stock quantity < 5)
    const lowStockProducts = await Product.countDocuments({ stockQuantity: { $lt: 5 } });

    // Total sales revenue aggregation
    const salesAggregate = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0;

    // 2. Recent transactions (last 5 invoices)
    const recentTransactions = await Invoice.find()
      .select('invoiceNumber customer totalAmount paymentMethod createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // 3. Monthly Sales Chart (Last 6 Months)
    // We group by year and month
    const monthlySalesAggregate = await Invoice.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' },
          invoicesCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 6
      }
    ]);

    // Format months for the Chart (e.g. "Jan", "Feb")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let monthlySales = monthlySalesAggregate.map(item => {
      const monthIndex = item._id.month - 1;
      return {
        month: `${monthNames[monthIndex]} ${item._id.year}`,
        sales: Number(item.sales.toFixed(2)),
        invoices: item.invoicesCount,
        // Helper fields to sort chronologically after mapping
        sortKey: new Date(item._id.year, monthIndex)
      };
    });

    // Sort chronologically (oldest to newest) for chart plotting
    monthlySales.sort((a, b) => a.sortKey - b.sortKey);

    // Remove sorting helper key before sending response
    monthlySales = monthlySales.map(({ sortKey, ...rest }) => rest);

    // If no sales data exists, populate dummy placeholder data so the chart looks nice
    if (monthlySales.length === 0) {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlySales.push({
          month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          sales: 0,
          invoices: 0
        });
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalSales: Number(totalSales.toFixed(2)),
        lowStockProducts,
        totalInvoices,
        totalCustomers
      },
      recentTransactions,
      monthlySales
    });
  } catch (error) {
    next(error);
  }
};
