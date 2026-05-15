const express = require('express');
const { 
    getEmployeeCountByStore, 
    getEmployeesByStore, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    clockIn, 
    clockOut,
    updateProfile,
    changePassword
} = require('../controllers/employeeController');
const { authenticateStoreStaff, authenticateStoreOwner } = require('../middleware/auth');

const router = express.Router();

router.get('/count/:storeId', authenticateStoreStaff, getEmployeeCountByStore);
router.get('/:storeId', authenticateStoreStaff, getEmployeesByStore);
router.post('/:storeId', authenticateStoreOwner, addEmployee);
router.put('/:id', authenticateStoreOwner, updateEmployee);
router.delete('/:id', authenticateStoreOwner, deleteEmployee);

router.post('/:id/clock-in', authenticateStoreStaff, clockIn);
router.post('/:id/clock-out', authenticateStoreStaff, clockOut);

// Personal Profile Management
router.put('/profile/update', authenticateStoreStaff, updateProfile);
router.put('/profile/change-password', authenticateStoreStaff, changePassword);

module.exports = router;
