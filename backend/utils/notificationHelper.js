const Notification = require('../models/Notification');

/**
 * Standard utility to create a notification in the DB and emit it via Socket.io
 * @param {object} app Express application instance (to access app.get("io"))
 * @param {object} params Notification parameters
 * @returns {Promise<object>} The created notification document
 */
const createNotification = async (app, { recipient, recipientModel, message, type = 'info', storeId = null }) => {
    try {
        const notification = await Notification.create({
            recipient,
            recipientModel,
            store_id: storeId,
            message,
            type
        });

        const io = app.get('io');
        if (io) {
            const formattedNotif = {
                id: notification._id,
                message: notification.message,
                read: notification.read,
                time: notification.createdAt,
                type: notification.type
            };
            // Broadcast to the user's personal room
            io.to(recipient.toString()).emit("newNotification", formattedNotif);
        }
        return notification;
    } catch (error) {
        console.error("Error inside createNotification utility:", error);
    }
};

/**
 * Helper to notify the store owner and all active employees when a product runs out of stock
 * @param {object} app Express application instance
 * @param {string} storeId MongoDB ObjectId string of the store
 * @param {string} productName Name of the product that ran out of stock
 */
const notifyStoreOutOfStock = async (app, storeId, productName) => {
    try {
        const Store = require('../models/Store');
        const Employee = require('../models/Employee');

        const store = await Store.findById(storeId);
        if (!store) return;

        // 1. Notify Store Owner
        await createNotification(app, {
            recipient: store.owner_id,
            recipientModel: 'StoreOwner',
            message: `Alert: Product '${productName}' is now OUT OF STOCK in store: '${store.name}'.`,
            type: 'alert',
            storeId
        });

        // 2. Notify all active Employees of that store
        const employees = await Employee.find({ store_id: storeId, status: 'active' });
        for (const emp of employees) {
            await createNotification(app, {
                recipient: emp._id,
                recipientModel: 'Employee',
                message: `Alert: Product '${productName}' is OUT OF STOCK. Please check inventory.`,
                type: 'alert',
                storeId
            });
        }
    } catch (err) {
        console.error("Error in notifyStoreOutOfStock helper:", err);
    }
};

module.exports = {
    createNotification,
    notifyStoreOutOfStock
};
