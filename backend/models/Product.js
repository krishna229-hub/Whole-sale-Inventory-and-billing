const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'Please add a SKU/Product code'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Please add a brand'],
      trim: true
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Please add the purchase price'],
      min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Please add the selling price'],
      min: [0, 'Selling price cannot be negative']
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Please add the stock quantity'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    supplierName: {
      type: String,
      required: [true, 'Please add the supplier name'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', ProductSchema);
