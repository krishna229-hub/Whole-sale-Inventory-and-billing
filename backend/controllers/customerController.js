const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query).sort({ totalAmountSpent: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer history
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerDetails = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Find all invoices for this customer
    const invoices = await Invoice.find({ 'customer.customerRef': customer._id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      customer,
      invoices
    });
  } catch (error) {
    next(error);
  }
};
