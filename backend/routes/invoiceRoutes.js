const express = require("express");
const router = express.Router();
const { generateInvoice, getInvoice, downloadInvoice, getCustomerInvoiceHistory, publicDownloadInvoice } = require("../controllers/invoiceController");
const { authenticateStoreStaff, authenticateCustomer } = require("../middleware/auth");

// Generate invoice from sale
router.post("/generate/:saleId", authenticateStoreStaff, generateInvoice);

// Get customer invoice history (verified via OTP and customer token)
router.get("/customer/history", authenticateCustomer, getCustomerInvoiceHistory);

// Get invoice details
router.get("/:invoiceId", authenticateStoreStaff, getInvoice);

// Download invoice PDF for staff
router.get("/download/:invoiceId", authenticateStoreStaff, downloadInvoice);

// Download invoice PDF publicly with email verification query
router.get("/public/download/:invoiceId", publicDownloadInvoice);

module.exports = router;
