const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a customer name'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Please add a phone number'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalAmountSpent: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Customer', CustomerSchema);
