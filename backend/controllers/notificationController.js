const Notification = require('../models/Notification');

// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50); // Get latest 50

        // Format for frontend
        const formatted = notifications.map(n => ({
            id: n._id,
            message: n.message,
            read: n.read,
            time: n.createdAt,
            type: n.type
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, message: "Marked as read" });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Mark all notifications as read for the user
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true }
        );

        res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Test Endpoint: Trigger a fake notification
const triggerTestNotification = async (req, res) => {
    try {
        const io = req.app.get('io');
        const userId = req.user._id;

        const messages = [
            "Item 'Wireless Mouse' in 'Store A' is below minimum stock.",
            "Store B just hit ₹1,00,000 in sales today!",
            "New employee 'Rahul' has registered.",
            "Your monthly report is ready."
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];

        const notification = await Notification.create({
            recipient: userId,
            recipientModel: 'StoreOwner', // Assuming owner for the demo
            message: randomMsg,
            type: 'info'
        });

        const formattedNotif = {
            id: notification._id,
            message: notification.message,
            read: notification.read,
            time: notification.createdAt,
            type: notification.type
        };

        // If the user has joined a room with their userId, emit to that room.
        // Or if they joined via storeId, we can emit there. 
        // For OwnerDashboard, they probably haven't joined a userId room yet. We should add that!
        if (io) {
            io.to(userId.toString()).emit("newNotification", formattedNotif);
        }

        res.json({ success: true, message: "Test notification triggered", data: formattedNotif });
    } catch (error) {
        console.error("Error triggering test notification:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    triggerTestNotification
};
