const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateStoreOwner, authenticate, authenticateStoreStaff, authorizePermission } = require("../middleware/auth"); // use your auth middleware

// Add product to store (storeId)
router.post("/add/:storeId", authenticateStoreStaff, authorizePermission('products', 'create'), productController.addProduct);

// Get product by QR code
router.get("/qr/:qrCode", productController.getProductByQR);

// Get products for a store
router.get("/:storeId", authenticateStoreStaff, authorizePermission('products', 'read'), productController.getProductsByStore);

// Update product (by product Id)
router.put("/:id", authenticateStoreStaff, authorizePermission('products', 'update'), productController.updateProduct);

// Delete product
router.delete("/:id", authenticateStoreStaff, authorizePermission('products', 'delete'), productController.deleteProduct);

/*
// Temporarily add in productRoutes.js to debug
router.get('/qr-test/:qrCode', async (req, res) => {
    const Product = require('../models/Product');
    const all = await Product.find({}, 'name qr_code');
    res.json({
        searching_for: req.params.qrCode,
        all_products: all
    });
});
*/
module.exports = router;
