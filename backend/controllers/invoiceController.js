const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const { customer, items, paymentMethod, taxRate } = req.body;

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name and phone number'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one product item to create an invoice'
      });
    }

    // Step 1: Validate stock quantity for all items
    const checkedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ID ${item.product}`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${product.name}'. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = Number(product.sellingPrice * item.quantity);
      subtotal += itemTotal;

      checkedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        total: itemTotal
      });
    }

    // Step 2: Calculate tax & total
    const currentTaxRate = taxRate !== undefined ? Number(taxRate) : 18; // Default 18% GST
    const taxAmount = Number(((subtotal * currentTaxRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    // Step 3: Find or Create Customer
    let customerDoc = await Customer.findOne({ phone: customer.phone });
    if (!customerDoc) {
      customerDoc = await Customer.create({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ''
      });
    } else {
      // Update existing customer name/email if provided
      customerDoc.name = customer.name;
      if (customer.email) {
        customerDoc.email = customer.email;
      }
    }

    // Generate Invoice Number: INV-YYMMDD-RANDOM
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // Step 4: Create Invoice Document
    const invoice = await Invoice.create({
      invoiceNumber,
      customer: {
        name: customerDoc.name,
        phone: customerDoc.phone,
        customerRef: customerDoc._id
      },
      items: checkedItems,
      subtotal,
      taxRate: currentTaxRate,
      tax: taxAmount,
      totalAmount,
      paymentMethod,
      createdBy: req.user._id
    });

    // Step 5: Update stock quantity of products & Customer stats
    for (const item of checkedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    // Update Customer Aggregates
    await Customer.findByIdAndUpdate(customerDoc._id, {
      $inc: {
        totalPurchases: 1,
        totalAmountSpent: totalAmount
      }
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { search, startDate, endDate } = req.query;
    let query = {};

    // Search filter: searches customer name/phone or invoice number
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const invoices = await Invoice.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.product');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice (admin only) - edit customer details, payment method, item quantities
// @route   PUT /api/invoices/:id
// @access  Private/Admin
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const { customer, items, paymentMethod, taxRate } = req.body;

    // --- Revert old stock quantities ---
    for (const oldItem of invoice.items) {
      await Product.findByIdAndUpdate(oldItem.product, {
        $inc: { stockQuantity: oldItem.quantity }
      });
    }

    // --- Revert old customer stats ---
    if (invoice.customer && invoice.customer.customerRef) {
      await Customer.findByIdAndUpdate(invoice.customer.customerRef, {
        $inc: {
          totalPurchases: -1,
          totalAmountSpent: -invoice.totalAmount
        }
      });
    }

    // --- Validate & build new items ---
    const checkedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ID ${item.product}` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        });
      }
      const itemTotal = Number(product.sellingPrice * item.quantity);
      subtotal += itemTotal;
      checkedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        total: itemTotal
      });
    }

    // --- Recalculate totals ---
    const currentTaxRate = taxRate !== undefined ? Number(taxRate) : invoice.taxRate;
    const taxAmount = Number(((subtotal * currentTaxRate) / 100).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    // --- Update customer record ---
    let customerDoc = await Customer.findOne({ phone: customer.phone });
    if (!customerDoc) {
      customerDoc = await Customer.create({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || ''
      });
    } else {
      customerDoc.name = customer.name;
      if (customer.email) customerDoc.email = customer.email;
      await customerDoc.save();
    }

    // --- Apply updates to invoice ---
    invoice.customer = {
      name: customerDoc.name,
      phone: customerDoc.phone,
      customerRef: customerDoc._id
    };
    invoice.items = checkedItems;
    invoice.subtotal = subtotal;
    invoice.taxRate = currentTaxRate;
    invoice.tax = taxAmount;
    invoice.totalAmount = totalAmount;
    invoice.paymentMethod = paymentMethod || invoice.paymentMethod;
    invoice.modificationRequest = { status: 'none' };

    await invoice.save();

    // --- Deduct new stock ---
    for (const item of checkedItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    // --- Update new customer stats ---
    await Customer.findByIdAndUpdate(customerDoc._id, {
      $inc: {
        totalPurchases: 1,
        totalAmountSpent: totalAmount
      }
    });

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Request modification (edit/delete) for an invoice
// @route   PUT /api/invoices/:id/request-modification
// @access  Private (Staff)
exports.requestModification = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'pending_edit' or 'pending_delete'
    
    if (!['pending_edit', 'pending_delete'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        modificationRequest: {
          status: action,
          reason: reason || '',
          requestedBy: req.user._id
        }
      },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete invoice (and revert stock/customer stats)
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Revert stock
    for (const item of invoice.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    // Revert customer stats
    if (invoice.customer && invoice.customer.customerRef) {
      await Customer.findByIdAndUpdate(invoice.customer.customerRef, {
        $inc: {
          totalPurchases: -1,
          totalAmountSpent: -invoice.totalAmount
        }
      });
    }

    await invoice.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve modification request (e.g., mark as approved or rejected)
// @route   PUT /api/invoices/:id/resolve-modification
// @access  Private/Admin
exports.resolveModification = async (req, res, next) => {
  try {
    const { status } = req.body; // 'none', 'approved', 'rejected'
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // If approving a delete request, permanently delete the invoice and revert stats
    if (status === 'approved' && invoice.modificationRequest.status === 'pending_delete') {
      // Revert stock
      for (const item of invoice.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }

      // Revert customer stats
      if (invoice.customer && invoice.customer.customerRef) {
        await Customer.findByIdAndUpdate(invoice.customer.customerRef, {
          $inc: {
            totalPurchases: -1,
            totalAmountSpent: -invoice.totalAmount
          }
        });
      }

      await invoice.deleteOne();
      return res.status(200).json({ success: true, data: {}, deleted: true });
    }

    invoice.modificationRequest.status = status;
    await invoice.save();

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

