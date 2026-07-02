const express = require('express');
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    triggerTestNotification 
} = require('../controllers/notificationController');
const { authenticateStoreStaff } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for the user
router.get('/', authenticateStoreStaff, getNotifications);

// Mark all as read
router.put('/read-all', authenticateStoreStaff, markAllAsRead);

// Mark specific notification as read
router.put('/:id/read', authenticateStoreStaff, markAsRead);

module.exports = router;
