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

module.exports = router;
