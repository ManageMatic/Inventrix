const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateStoreOwner, authenticate } = require("../middleware/auth"); // use your auth middleware

// Add product to store (storeId)
router.post("/add/:storeId", authenticateStoreOwner, productController.addProduct);

// Get products for a store
router.get("/:storeId", authenticateStoreOwner, productController.getProductsByStore);

// Update product (by product Id)
router.put("/:id", authenticateStoreOwner, productController.updateProduct);

// Delete product
router.delete("/:id", authenticateStoreOwner, productController.deleteProduct);

router.get("/qr/:qrCode", productController.getProductByQR);

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
