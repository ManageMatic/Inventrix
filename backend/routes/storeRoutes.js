const express = require('express');
const { createStore, getMyStores, getStoreById, getAllStores, updateStore, deleteStore, getAnalytics } = require('../controllers/storeController');
const { authenticateStoreOwner } = require('../middleware/auth');

const router = express.Router();

router.get('/analytics', authenticateStoreOwner, getAnalytics); // Fetch analytics
router.get('/all', getAllStores); // Fetch all stores (public - for employee registration)
router.get('/getMyStores', authenticateStoreOwner, getMyStores); // Fetch owner stores
router.post('/createStore', authenticateStoreOwner, createStore); // Create a store
router.get('/:id', authenticateStoreOwner, getStoreById);
router.put('/:id', authenticateStoreOwner, updateStore);
router.delete('/:id', authenticateStoreOwner, deleteStore);

module.exports = router;
