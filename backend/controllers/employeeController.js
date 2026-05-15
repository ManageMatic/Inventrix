const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

exports.getEmployeeCountByStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const count = await Employee.countDocuments({ store_id: storeId });

        res.status(200).json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('GET EMPLOYEE COUNT ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee count',
            error: error.message
        });
    }
};

exports.getEmployeesByStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const owner_id = req.user._id;

        let query = {};
        if (storeId === "All" || storeId === "undefined") {
            const Store = require('../models/Store');
            const stores = await Store.find({ owner_id }).select('_id');
            const storeIds = stores.map(s => s._id);
            query = { store_id: { $in: storeIds } };
        } else {
            query = { store_id: storeId };
        }

        const employees = await Employee.find(query)
            .populate('role', 'name')
            .populate('store_id', 'name');
        
        res.status(200).json({
            success: true,
            data: employees
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
    }
};

exports.addEmployee = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { name, email, phone, roleId, status, password } = req.body;

        const existing = await Employee.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password || 'password123', 10);

        let assignedRole = roleId;
        if (!assignedRole) {
            const defaultRole = await Role.findOne({ name: 'employee' });
            if (defaultRole) assignedRole = defaultRole._id;
        }

        const newEmployee = await Employee.create({
            employee_id: `EMP${Date.now()}`,
            name,
            email,
            phone,
            password: hashedPassword,
            role: assignedRole,
            status: status || 'active',
            store_id: storeId
        });

        res.status(201).json({ success: true, message: 'Employee added successfully', data: newEmployee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add employee', error: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Prevent password update via this route
        delete updates.password;

        const employee = await Employee.findByIdAndUpdate(id, updates, { new: true });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        res.status(200).json({ success: true, message: 'Employee updated successfully', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update employee', error: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete employee', error: error.message });
    }
};

exports.clockIn = async (req, res) => {
    try {
        const { id } = req.params; // employee id
        const employee = await Employee.findById(id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        if (employee.schedule && employee.schedule.clockedIn) {
            return res.status(400).json({ success: false, message: 'Employee already clocked in' });
        }

        employee.schedule = {
            ...employee.schedule,
            clockedIn: true,
            lastClockIn: new Date()
        };
        await employee.save();

        // Create shift
        await Shift.create({
            employee_id: id,
            store_id: employee.store_id,
            date: new Date(),
            clockInTime: new Date(),
            status: 'in-progress'
        });

        res.status(200).json({ success: true, message: 'Clocked in successfully', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to clock in', error: error.message });
    }
};

exports.clockOut = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        if (!employee.schedule || !employee.schedule.clockedIn) {
            return res.status(400).json({ success: false, message: 'Employee is not clocked in' });
        }

        employee.schedule.clockedIn = false;
        employee.schedule.lastClockOut = new Date();
        await employee.save();

        // Update shift
        const shift = await Shift.findOne({ employee_id: id, status: 'in-progress' }).sort({ createdAt: -1 });
        if (shift) {
            shift.clockOutTime = new Date();
            shift.status = 'completed';
            await shift.save();
        }

        res.status(200).json({ success: true, message: 'Clocked out successfully', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to clock out', error: error.message });
    }
};

// Update personal profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const employee = await Employee.findByIdAndUpdate(
            req.user._id,
            { name, phone },
            { new: true }
        ).populate('role', 'name').populate('store_id', 'name');

        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully', 
            data: {
                id: employee._id,
                employee_id: employee.employee_id,
                name: employee.name,
                email: employee.email,
                phone: employee.phone,
                userType: 'employee',
                role: employee.role,
                store_id: employee.store_id,
                schedule: employee.schedule,
                performance: employee.performance
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const employee = await Employee.findById(req.user._id).select('+password');

        const isMatch = await bcrypt.compare(currentPassword, employee.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password' });

        employee.password = await bcrypt.hash(newPassword, 10);
        await employee.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to change password', error: error.message });
    }
};
