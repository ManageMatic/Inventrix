// backend/controllers/productController.js
const Product = require("../models/Product");
const Store = require("../models/Store");
const crypto = require("crypto");

/**
 * Add product to a store
 * POST /api/products/add/:storeId
 */

exports.addProduct = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { name, category, price, quantity, imageUrl, description } = req.body;

        // ✅ Validation
        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: "Product name and price are required",
            });
        }

        // Auto-generate product_id
        const product_id = `PROD-${Math.floor(Math.random() * 1000)}`;

        // ✅ Generate unique QR code value
        const qr_code = `QR-${crypto.randomBytes(6).toString("hex")}`;

        const product = new Product({
            product_id,
            store: storeId,
            name,
            category,
            price,
            quantity: quantity || 0,
            imageUrl,
            description,
            qr_code,
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data: product,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message,
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

        // find products that belong to this store
        const products = await Product.find({ store: storeId });

        return res.status(200).json({
            success: true,
            data: products,
        });
        console.log("Products fetched:", products);
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
