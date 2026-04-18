const express = require("express");
const router = express.Router();
const { 
    createSale, 
    getSalesByStore, 
    getSaleById, 
    updateSale, 
    deleteSale,
    getRecentSales 
} = require("../controllers/salesController");
const { authenticateStoreStaff } = require("../middleware/auth");

// Create sale
router.post("/create", authenticateStoreStaff, createSale);

// Get all sales for a store
router.get("/store/:storeId", authenticateStoreStaff, getSalesByStore);

// Get recent sales for a store (dashboard)
router.get("/recent/:storeId", authenticateStoreStaff, getRecentSales);

// Get single sale by ID
router.get("/:saleId", authenticateStoreStaff, getSaleById);

// Update sale
router.put("/:saleId", authenticateStoreStaff, updateSale);

// Delete sale
router.delete("/:saleId", authenticateStoreStaff, deleteSale);

module.exports = router;