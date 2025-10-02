const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    inventory_id: {
        type: String,
        required: true,
        unique: true
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    stock_in: { type: Number, default: 0 },
    stock_out: { type: Number, default: 0 },
    available_stock: {
        type: Number,
        required: true,
        min: 0
    },
    lastRestocked: Date
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
