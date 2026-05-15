import Store from '../models/Store.js';
import Product from '../models/Product.js';
import Employee from '../models/Employee.js';
import Sale from '../models/Sale.js';

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

// ---------------- Get Analytics ----------------
export const getAnalytics = async (req, res) => {
    try {
        const { storeId } = req.query;
        const owner_id = req.user._id;

        let productsQuery = {};
        let otherQuery = {}; // for employees and sales (store_id)

        if (storeId && storeId !== "All" && storeId !== "undefined") {
            const store = await Store.findOne({ _id: storeId, owner_id });
            if (!store) {
                return res.status(403).json({ success: false, message: "Access denied or store not found" });
            }
            productsQuery = { store: storeId };
            otherQuery = { store_id: storeId };
        } else {
            const stores = await Store.find({ owner_id }).select('_id');
            const storeIds = stores.map(s => s._id);
            productsQuery = { store: { $in: storeIds } };
            otherQuery = { store_id: { $in: storeIds } };
        }

        const productsCount = await Product.countDocuments(productsQuery);
        const employeesCount = await Employee.countDocuments(otherQuery);
        const sales = await Sale.find(otherQuery).select('totalAmount date');
        
        const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
        const totalSalesCount = sales.length;

        const chartDataMap = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        const d = new Date();
        for (let i = 5; i >= 0; i--) {
            const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
            chartDataMap[monthNames[pastDate.getMonth()]] = { sales: 0, profit: 0 };
        }

        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const monthStr = monthNames[saleDate.getMonth()];
            if (chartDataMap[monthStr]) {
                chartDataMap[monthStr].sales += sale.totalAmount;
                chartDataMap[monthStr].profit += sale.totalAmount * 0.4; 
            }
        });

        const chartData = Object.keys(chartDataMap).map(month => ({
            month,
            sales: chartDataMap[month].sales,
            profit: chartDataMap[month].profit
        }));

        res.json({
            success: true,
            stats: {
                products: productsCount,
                sales: sales.length,
                employees: employeesCount,
                revenue: "₹" + totalRevenue.toLocaleString('en-IN')
            },
            chartData
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ success: false, message: "Server error fetching analytics" });
    }
};
