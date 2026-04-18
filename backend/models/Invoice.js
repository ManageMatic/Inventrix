const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoice_id: {
        type: String,
        required: true,
        unique: true
    },
    sale_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    store_owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoreOwner'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
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
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi'],
        required: true
    },
    invoiceUrl: String,
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);