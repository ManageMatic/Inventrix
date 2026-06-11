const mongoose = require('mongoose');

const supplierProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String,
        default: 'General'
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SupplierProduct', supplierProductSchema);
