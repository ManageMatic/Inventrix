const express = require("express");
const router = express.Router();
const { 
    createSale, 
    getSalesByStore, 
    getSaleById, 
    updateSale, 
    deleteSale,
    getRecentSales,
    getAdvancedAnalytics
} = require("../controllers/salesController");
const { authenticateStoreStaff, authorizePermission } = require("../middleware/auth");

// ... (other routes)

// Get advanced analytics
router.get("/analytics/:storeId", authenticateStoreStaff, authorizePermission('sales', 'read'), getAdvancedAnalytics);

// Create sale
router.post("/create", authenticateStoreStaff, createSale);

// Get all sales for a store
router.get("/store/:storeId", authenticateStoreStaff, authorizePermission('sales', 'read'), getSalesByStore);

// Get recent sales for a store (dashboard)
router.get("/recent/:storeId", authenticateStoreStaff, authorizePermission('sales', 'read'), getRecentSales);

// Get single sale by ID
router.get("/:saleId", authenticateStoreStaff, authorizePermission('sales', 'read'), getSaleById);

// Update sale
router.put("/:saleId", authenticateStoreStaff, authorizePermission('sales', 'update'), updateSale);

// Delete sale
router.delete("/:saleId", authenticateStoreStaff, authorizePermission('sales', 'delete'), deleteSale);

module.exports = router;