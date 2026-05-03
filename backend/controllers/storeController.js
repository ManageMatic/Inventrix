import Store from '../models/Store.js';

// ── Public endpoint to fetch all stores (for employee registration)
export const getAllStores = async (req, res) => {
    try {
        const stores = await Store.find()
            .select('_id name location address')
            .lean();

        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stores',
            error: error.message
        });
    }
};

// ────────────────────────────────────────────────────────────

// ---------------- Create Store ----------------
export const createStore = async (req, res) => {
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
export const getMyStores = async (req, res) => {
    try {
        const owner_id = req.user._id;
        const stores = await Store.find({ owner_id });
        res.json({ success: true, data: stores });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch stores', error: error.message });
    }
};

// ---------------- Get Store by ID ----------------
export const getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id)
            .populate('owner_id', 'name email phone');

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        res.status(200).json({ success: true, data: store });
    } catch (err) {
        console.error("Error fetching store:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------- Update Store ----------------
export const updateStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        // Check if user owns this store
        if (store.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const { name, address, contact, settings } = req.body;

        // Update main store fields
        if (name !== undefined) store.name = name;
        if (address !== undefined) store.address = address;
        if (contact !== undefined) store.contact = contact;
        if (settings !== undefined) store.settings = { ...store.settings, ...settings };

        await store.save();

        res.json({
            success: true,
            message: "Store updated successfully",
            data: store
        });
    } catch (error) {
        console.error("Error updating store:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------------- Delete Store ----------------
export const deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        if (store.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        await Store.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Store deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting store:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
