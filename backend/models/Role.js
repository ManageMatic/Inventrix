const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['admin', 'store_owner', 'employee', 'supplier', 'customer']
    },
    permissions: [{
        resource: { type: String, required: true }, // e.g., 'products', 'sales'
        actions: [{ type: String, required: true }] // e.g., ['create', 'read']
    }],
    description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
