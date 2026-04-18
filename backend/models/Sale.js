const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  sale_id: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  store_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  store_owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreOwner'
  },
  customer_mobile: {
    type: String
  },
  items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Validation to ensure either employee_id or store_owner_id is provided
saleSchema.pre('validate', function(next) {
  if (!this.employee_id && !this.store_owner_id) {
    const error = new Error('Either employee_id or store_owner_id must be provided');
    next(error);
  } else {
    next();
  }
});

module.exports = mongoose.model('Sale', saleSchema);