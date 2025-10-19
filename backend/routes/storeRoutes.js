const express = require('express');
const { createStore, getMyStores, getStoreById } = require('../controllers/storeController');
const { authenticateStoreOwner } = require('../middleware/auth');

const router = express.Router();

router.get('/getMyStores', authenticateStoreOwner, getMyStores); // Fetch owner stores
router.post('/createStore', authenticateStoreOwner, createStore); // Create a store
router.get("/:id", authenticateStoreOwner, getStoreById);

module.exports = router;
