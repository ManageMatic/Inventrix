const mongoose = require('mongoose');

const storeOwnerSchema = new mongoose.Schema({
    owner_id: {
        type: String,
        required: true,
        unique: true
    },
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: { type: String, required: true },
    password: {
        type: String,
        required: true,
        select: false
    },
    stores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    }],
    resetOTP: String,
    otpExpiry: Date,
}, { timestamps: true });

module.exports = mongoose.model('StoreOwner', storeOwnerSchema);
