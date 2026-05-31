const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: [0, 'Selling price cannot be negative']
  },
  total: {
    type: Number,
    required: true
  }
});

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Please add a customer name']
      },
      phone: {
        type: String,
        required: [true, 'Please add a customer phone number']
      },
      customerRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
      }
    },
    items: [InvoiceItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      required: true,
      default: 18 // Default 18% GST
    },
    tax: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'UPI', 'Card']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    modificationRequest: {
      status: {
        type: String,
        enum: ['none', 'pending_edit', 'pending_delete', 'approved', 'rejected'],
        default: 'none'
      },
      reason: {
        type: String
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
