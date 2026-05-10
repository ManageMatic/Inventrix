const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientModel',
    required: true
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['StoreOwner', 'Employee']
  },
  store_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['alert', 'milestone', 'system', 'approval', 'info'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
