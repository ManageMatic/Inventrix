const express = require('express');
const router = express.Router();
const { 
    addSupplier, 
    getSuppliersForOwner, 
    createPurchaseOrder, 
    getOwnerPOs, 
    getSupplierDashboard, 
    getSupplierPOs, 
    updatePOStatus, 
    getSuppliedProducts, 
    supplyProduct 
} = require('../controllers/supplierController');

const { authenticateStoreOwner, authenticateSupplier } = require('../middleware/auth');
const { logActivity } = require('../middleware/rbac');

// ── Store Owner Endpoints ─────────────────────────────────────
router.post('/add', authenticateStoreOwner, logActivity('create', 'supplier'), addSupplier);
router.get('/owner-list', authenticateStoreOwner, getSuppliersForOwner);
router.post('/po/create', authenticateStoreOwner, logActivity('create', 'purchaseorder'), createPurchaseOrder);
router.get('/po/owner', authenticateStoreOwner, getOwnerPOs);

// ── Supplier Endpoints ────────────────────────────────────────
router.get('/dashboard', authenticateSupplier, getSupplierDashboard);
router.get('/pos', authenticateSupplier, getSupplierPOs);
router.put('/po/:id', authenticateSupplier, logActivity('update', 'purchaseorder'), updatePOStatus);
router.get('/my-products', authenticateSupplier, getSuppliedProducts);
router.post('/products/supply', authenticateSupplier, supplyProduct);

module.exports = router;
