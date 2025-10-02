const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const StoreOwner = require('../models/StoreOwner');
const Supplier = require('../models/Supplier');
const Role = require('../models/Role');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// ---------------- Register ----------------
exports.register = async (req, res) => {
    try {
        const { userType, name, email, password, phone } = req.body;

        if (userType === 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Customers cannot register.'
            });
        }

        let Model;
        if (userType === 'employee') Model = Employee;
        else if (userType === 'storeOwner') Model = StoreOwner;
        else if (userType === 'supplier') Model = Supplier;
        else return res.status(400).json({ success: false, message: 'Invalid user type' });

        // Check if email already exists
        const existing = await Model.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Auto-generate employee_id/store_owner_id if applicable
        let extraFields = {};
        if (userType === 'employee') {
            // Fetch default employee role
            const defaultRole = await Role.findOne({ name: 'employee' });
            extraFields = {
                employee_id: `EMP${Date.now()}`,
                role: defaultRole ? defaultRole._id : undefined
            };
        }

        if (userType === 'storeOwner') {
            // Auto-generate owner_id
            extraFields = {
                owner_id: `OWNER${Date.now()}`
            };
        }

        if (userType === 'supplier') {
            extraFields = {
                supplier_id: `SUP${Date.now()}`,
                contact: phone // you can use the same phone as contact
            };
        }

        // Create user
        const user = await Model.create({
            name,
            email,
            phone,
            password: hashedPassword,
            ...extraFields
        });

        const token = generateToken(user._id, userType, user.role || null);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            message: `${userType} registered successfully`,
            token,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, userType }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
};

// ---------------- Login ----------------
exports.login = async (req, res) => {
    try {
        const { userType, email, password } = req.body;

        if (userType === 'customer') {
            return res.status(403).json({
                success: false,
                message: 'Customers cannot login.'
            });
        }

        let Model;
        if (userType === 'employee') Model = Employee;
        else if (userType === 'storeOwner') Model = StoreOwner;
        else if (userType === 'supplier') Model = Supplier;
        else return res.status(400).json({ success: false, message: 'Invalid user type' });

        const user = await Model.findOne({ email }).select('+password');
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const token = generateToken(user._id, userType, user.role || null);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, userType }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
};

// ---------------- Logout ----------------
exports.logout = async (req, res) => {
    try {
        // If you store refresh token in cookie:
        res.clearCookie('refreshToken', { path: '/' });

        // Otherwise, just let client delete tokens
        res.status(200).json({ success: true, message: 'Logout successful' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
    }
};
