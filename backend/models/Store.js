const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreOwner',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active'
  },
  contact: {
    phone: String,
    email: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);