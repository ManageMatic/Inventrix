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
    }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
