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
    addCatalogProduct,
    getCatalogProducts,
    getCatalogProductsForOwner,
    deleteCatalogProduct
} = require('../controllers/supplierController');

const { authenticateStoreOwner, authenticateSupplier } = require('../middleware/auth');
const { logActivity } = require('../middleware/rbac');

// ── Store Owner Endpoints ─────────────────────────────────────
router.post('/add', authenticateStoreOwner, logActivity('create', 'supplier'), addSupplier);
router.get('/owner-list', authenticateStoreOwner, getSuppliersForOwner);
router.post('/po/create', authenticateStoreOwner, logActivity('create', 'purchaseorder'), createPurchaseOrder);
router.get('/po/owner', authenticateStoreOwner, getOwnerPOs);
router.get('/products/catalog/:supplierId', authenticateStoreOwner, getCatalogProductsForOwner);

// ── Supplier Endpoints ────────────────────────────────────────
router.get('/dashboard', authenticateSupplier, getSupplierDashboard);
router.get('/pos', authenticateSupplier, getSupplierPOs);
router.put('/po/:id', authenticateSupplier, logActivity('update', 'purchaseorder'), updatePOStatus);

// Catalog management
router.post('/products/catalog/add', authenticateSupplier, logActivity('create', 'supplierproduct'), addCatalogProduct);
router.get('/products/catalog', authenticateSupplier, getCatalogProducts);
router.delete('/products/catalog/:id', authenticateSupplier, logActivity('delete', 'supplierproduct'), deleteCatalogProduct);

module.exports = router;
