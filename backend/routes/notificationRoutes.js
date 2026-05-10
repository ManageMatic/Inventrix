const express = require('express');
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    triggerTestNotification 
} = require('../controllers/notificationController');
const { authenticateStoreOwner } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for the user
router.get('/', authenticateStoreOwner, getNotifications);

// Mark all as read
router.put('/read-all', authenticateStoreOwner, markAllAsRead);

// Mark specific notification as read
router.put('/:id/read', authenticateStoreOwner, markAsRead);

module.exports = router;
