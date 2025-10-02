const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customer_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        sparse: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String
    },
    password: {
        type: String,
        select: false
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    isRegistered: {
        type: Boolean,
        default: false // Walk-in customers are not registered
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);