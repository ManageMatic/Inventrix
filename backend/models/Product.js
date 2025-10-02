const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true,
        unique: true
    },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    qr_code: { type: String, unique: true },
    description: String,
    imageUrl: String,
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    reorderLevel: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
