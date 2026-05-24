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
const { logActivity } = require('../middleware/rbac');

const router = express.Router();

router.get('/count/:storeId', authenticateStoreStaff, getEmployeeCountByStore);
router.get('/:storeId', authenticateStoreStaff, getEmployeesByStore);
router.post('/:storeId', authenticateStoreOwner, logActivity('create', 'employee'), addEmployee);
router.put('/:id', authenticateStoreOwner, logActivity('update', 'employee'), updateEmployee);
router.delete('/:id', authenticateStoreOwner, logActivity('delete', 'employee'), deleteEmployee);

router.post('/:id/clock-in', authenticateStoreStaff, logActivity('clock_in', 'shift'), clockIn);
router.post('/:id/clock-out', authenticateStoreStaff, logActivity('clock_out', 'shift'), clockOut);

// Personal Profile Management
router.put('/profile/update', authenticateStoreStaff, updateProfile);
router.put('/profile/change-password', authenticateStoreStaff, changePassword);

module.exports = router;
