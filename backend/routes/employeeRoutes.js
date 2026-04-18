const express = require('express');
const { getEmployeeCountByStore } = require('../controllers/employeeController');
const { authenticateStoreStaff } = require('../middleware/auth');

const router = express.Router();

router.get('/count/:storeId', authenticateStoreStaff, getEmployeeCountByStore);

module.exports = router;
