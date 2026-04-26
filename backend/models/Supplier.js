const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    supplier_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        sparse: true // allows multiple null emails
    },
    productsSupplied: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    password: {
        type: String,
        required: true,
        select: false
    },
    resetOTP: String,
    otpExpiry: Date,
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
