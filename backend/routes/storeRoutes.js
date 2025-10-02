const express = require('express');
const router = express.Router();
const { authenticateStoreOwner } = require('../middleware/auth');
const { createStore, getMyStores } = require('../controllers/storeController');

// Create a new store
router.post('/create', authenticateStoreOwner, createStore);

// Get stores of logged-in store owner
router.get('/my-stores', authenticateStoreOwner, getMyStores);

module.exports = router;
