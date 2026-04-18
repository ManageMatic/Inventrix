const express = require("express");
const router = express.Router();
const { generateInvoice, getInvoice, downloadInvoice } = require("../controllers/invoiceController");
const { authenticateStoreStaff } = require("../middleware/auth");

// Generate invoice from sale
router.post("/generate/:saleId", authenticateStoreStaff, generateInvoice);

// Get invoice details
router.get("/:invoiceId", authenticateStoreStaff, getInvoice);

// Download invoice PDF
router.get("/download/:invoiceId", authenticateStoreStaff, downloadInvoice);

module.exports = router;
