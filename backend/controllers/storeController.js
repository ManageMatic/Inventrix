const Store = require('../models/Store');

// ---------------- Create Store ----------------
exports.createStore = async (req, res) => {
    try {
        const { name, location, contact, address } = req.body;

        // Only StoreOwner can create a store
        const owner_id = req.user._id;

        // Auto-generate store_id
        const store_id = `STR${Date.now()}`;

        const store = await Store.create({
            store_id,
            name,
            location,
            owner_id,
            contact,
            address
        });

        res.status(201).json({
            success: true,
            message: 'Store created successfully',
            data: store
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Store creation failed',
            error: error.message
        });
    }
};

// ---------------- Get Stores of Owner ----------------
exports.getMyStores = async (req, res) => {
    try {
        const owner_id = req.user._id;
        const stores = await Store.find({ owner_id });
        res.json({ success: true, data: stores });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch stores', error: error.message });
    }
};
