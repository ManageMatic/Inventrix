// backend/controllers/productController.js
const Product = require("../models/Product");
const Store = require("../models/Store");
const crypto = require("crypto");
const QRCode = require("qrcode");
const path = require("path");
const os = require("os");

// Utility to get local IP address (for testing on LAN)
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let name of Object.keys(interfaces)) {
        for (let net of interfaces[name]) {
            if (net.family === "IPv4" && !net.internal) {
                return net.address;
            }
        }
    }
    return "localhost";
}

const LOCAL_IP = getLocalIP();

/**
 * Add product to a store
 * POST /api/products/add/:storeId
 */

exports.addProduct = async (req, res) => {
    try {
        const { storeId } = req.params;

        const {
            name,
            category,
            purchasePrice,
            sellingPrice,
            quantity,
            description,
            reorderLevel
        } = req.body;

        if (!name || !purchasePrice || !sellingPrice) {
            return res.status(400).json({
                success: false,
                message: "Name, purchase price and selling price are required"
            });
        }

        // Auto-generate product_id
        const product_id = `PROD-${Math.floor(Math.random() * 1000)}`;

        const qr_code = `INV-${product_id}`;

        const product = new Product({
            product_id,
            store: storeId,
            name,
            category,
            purchasePrice,
            sellingPrice,
            quantity: quantity || 0,
            reorderLevel: reorderLevel || 0,
            description,
            qr_code
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data: product
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Duplicate QR code detected. Try again."
            });
        }

        console.error("Error adding product:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add product"
        });
    }
};

/**
 * List products for a store
 * GET /api/products/:storeId
 */
exports.getProductsByStore = async (req, res) => {
    try {
        const storeId = req.params.storeId;
        const owner_id = req.user._id;

        let query = {};
        if (storeId === "All" || storeId === "undefined") {
            const stores = await Store.find({ owner_id }).select('_id');
            const storeIds = stores.map(s => s._id);
            query = { store: { $in: storeIds } };
        } else {
            query = { store: storeId };
        }

        const products = await Product.find(query).populate('store', 'name');

        return res.status(200).json({
            success: true,
            data: products,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};

/**
 * Update product
 * PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        return res.status(200).json({ success: true, data: product });
    } catch (err) {
        console.error("updateProduct error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Delete product
 * DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        return res.status(200).json({ success: true, message: "Product deleted" });
    } catch (err) {
        console.error("deleteProduct error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * Get product by QR code
 * GET /api/products/qr/:qrcode
 */
exports.getProductByQR = async (req, res) => {
    try {
        const { qrCode } = req.params;
        const { storeId } = req.query;

        // ✅ DEBUG LOGS
        console.log("📦 QR scanned:", qrCode);
        console.log("🏪 Store ID:", storeId);

        const product = await Product.findOne({ qr_code: qrCode });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // ✅ DEBUG EMIT
        console.log("📡 Emitting to room:", storeId);

        req.app.get("io").to(storeId).emit("product-scanned", product);

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};