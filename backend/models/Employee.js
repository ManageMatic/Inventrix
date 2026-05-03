const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employee_id: {
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
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store'
    },
    resetOTP: String,
    otpExpiry: Date,
    performance: {
        salesCount: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviews: [{
            text: String,
            date: { type: Date, default: Date.now }
        }]
    },
    schedule: {
        clockedIn: { type: Boolean, default: false },
        lastClockIn: { type: Date },
        lastClockOut: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
