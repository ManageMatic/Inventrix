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

        let pPrice = purchasePrice;
        if (req.userType === 'employee') {
            pPrice = pPrice !== undefined && pPrice !== null ? pPrice : 0;
        }

        if (!name || pPrice === undefined || pPrice === null || !sellingPrice) {
            return res.status(400).json({
                success: false,
                message: "Name, purchase price and selling price are required"
            });
        }

        // Auto-generate product_id
        let product_id;
        let isUnique = false;
        while (!isUnique) {
            const num = Math.floor(100 + Math.random() * 900);
            product_id = `PROD_${num}`;
            const exists = await Product.findOne({ product_id });
            if (!exists) {
                isUnique = true;
            }
        }

        const qr_code = `INV-${product_id}`;

        const product = new Product({
            product_id,
            store: storeId,
            name,
            category,
            purchasePrice: pPrice,
            sellingPrice,
            quantity: quantity || 0,
            reorderLevel: reorderLevel || 0,
            description,
            qr_code
        });

        await product.save();

        let returnedData = product.toObject();
        if (req.userType === 'employee') {
            delete returnedData.purchasePrice;
        }

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data: returnedData
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

        let products = await Product.find(query).populate('store', 'name');

        if (req.userType === 'employee') {
            products = products.map(p => {
                const prodObj = p.toObject();
                delete prodObj.purchasePrice;
                return prodObj;
            });
        }

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
        const updates = { ...req.body };

        if (req.userType === 'employee') {
            delete updates.purchasePrice;
        }

        const product = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        if (product.quantity <= 0) {
            const { notifyStoreOutOfStock } = require("../utils/notificationHelper");
            notifyStoreOutOfStock(req.app, product.store, product.name);
        }

        let returnedData = product.toObject();
        if (req.userType === 'employee') {
            delete returnedData.purchasePrice;
        }

        return res.status(200).json({ success: true, data: returnedData });
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

        const prodObj = product.toObject();
        delete prodObj.purchasePrice;

        // ✅ DEBUG EMIT
        console.log("📡 Emitting to room:", storeId);

        req.app.get("io").to(storeId).emit("product-scanned", prodObj);

        res.json({ success: true, data: prodObj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};