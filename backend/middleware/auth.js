const jwt = require('jsonwebtoken');
const Models = require('../models'); // central models export

// -------------------- JWT Token Generators --------------------

// Generate JWT Token
const generateToken = (userId, userType, role) => {
    return jwt.sign(
        { id: userId, userType, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
    );
};

// -------------------- Authentication Middleware --------------------

const authenticate = async (req, res, next) => {
    try {
        let token;

        // Check headers first
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Fallback to cookies
        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Pick model based on userType
        let user;
        switch (decoded.userType) {
            case 'employee':
                user = await Models.Employee.findById(decoded.id)
                    .populate('role')
                    .populate('store_id', 'name') // Populate store name
                    .select('-password');
                break;
            case 'store_owner':
                user = await Models.StoreOwner.findById(decoded.id).select('-password');
                break;
            case 'customer':
                user = await Models.Customer.findById(decoded.id).select('-password');
                break;
            case 'supplier':
                user = await Models.Supplier.findById(decoded.id).select('-password');
                break;
            default:
                return res.status(401).json({
                    success: false,
                    message: 'Invalid user type in token'
                });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Extra check: Employee status
        if (decoded.userType === 'employee' && user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Your account is inactive. Contact administrator.'
            });
        }

        // Attach user to request
        req.user = user;
        req.userType = decoded.userType;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Authentication failed. Token invalid or expired.',
            error: error.message
        });
    }
};

// -------------------- Restriction Middleware --------------------

const restrictTo = (allowedTypes) => {
    return (req, res, next) => {
        if (!allowedTypes.includes(req.userType)) {
            return res.status(403).json({
                success: false,
                message: `Access restricted to: ${allowedTypes.join(', ')}`
            });
        }
        next();
    };
};

// -------------------- Predefined UserType Middlewares --------------------

const authenticateStoreOwner = [authenticate, restrictTo(['store_owner'])];
const authenticateEmployee = [authenticate, restrictTo(['employee'])];
const authenticateCustomer = [authenticate, restrictTo(['customer'])];
const authenticateSupplier = [authenticate, restrictTo(['supplier'])];
const authenticateStoreStaff = [authenticate, restrictTo(['store_owner', 'employee'])];

// -------------------- RBAC Permission Middleware --------------------

const authorizePermission = (resource, action) => {
    return (req, res, next) => {
        // Store Owners have full access
        if (req.userType === 'store_owner') {
            return next();
        }

        // Check Employee permissions
        if (req.userType === 'employee') {
            const user = req.user;
            if (!user.role || !user.role.permissions) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. No permissions assigned."
                });
            }

            const permission = user.role.permissions.find(p => p.resource === resource);
            if (permission && permission.actions.includes(action)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: `Permission denied: ${resource}:${action}`
            });
        }

        return res.status(403).json({
            success: false,
            message: "Access denied. Unauthorized user type."
        });
    };
};

// -------------------- Export --------------------

module.exports = {
    generateToken,
    generateRefreshToken,
    authenticate,
    restrictTo,
    authenticateStoreOwner,
    authenticateEmployee,
    authenticateCustomer,
    authenticateSupplier,
    authenticateStoreStaff,
    authorizePermission
};
