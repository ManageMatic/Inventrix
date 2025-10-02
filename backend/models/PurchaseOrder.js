const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    po_id: {
        type: String,
        required: true,
        unique: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoreOwner',
        required: true
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
        quantity: {
            type: Number,
            required: true
        },
        unitPrice: {
            type: Number,
            required: true
        },
        totalPrice: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'partially_accepted', 'delivered', 'cancelled'],
        default: 'pending'
    },
    supplierResponse: {
        message: String,
        respondedAt: Date,
        acceptedItems: [{
            product_id: mongoose.Schema.Types.ObjectId,
            acceptedQuantity: Number,
            rejectedQuantity: Number,
            reason: String
        }]
    },
    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,
    notes: String,
    orderDate: {
        type: Date,
        default: Date.now
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);