const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    store_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    clockInTime: { type: Date },
    clockOutTime: { type: Date },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'absent', 'in-progress'],
        default: 'scheduled'
    },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
