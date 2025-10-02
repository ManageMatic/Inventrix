const { Role, ActivityLog, StoreOwner, Invoice, PurchaseOrder } = require('../models');

//Check if user has required role
const hasRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (req.userType === 'storeOwner') return next();

            if (!req.user?.role) {
                return res.status(403).json({ success: false, message: 'Access denied. No role assigned.' });
            }

            const role = await Role.findById(req.user.role);
            if (!role) {
                return res.status(403).json({ success: false, message: 'Access denied. Invalid role.' });
            }

            if (!allowedRoles.includes(role.name)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
                });
            }

            req.userRole = role;
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error checking role', error: error.message });
        }
    };
};

//Check if user has permission for resource + action
const hasPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (req.userType === 'storeOwner') return next();

            if (!req.user?.role) {
                return res.status(403).json({ success: false, message: 'Access denied. No role assigned.' });
            }

            const role = await Role.findById(req.user.role);
            if (!role) {
                return res.status(403).json({ success: false, message: 'Access denied. Invalid role.' });
            }

            const resourcePermission = role.permissions.find(perm => perm.resource === resource);
            if (!resourcePermission) {
                return res.status(403).json({ success: false, message: `Access denied. No permissions for ${resource}` });
            }

            if (!resourcePermission.actions.includes(action)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Cannot ${action} ${resource}`
                });
            }

            req.userRole = role;
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error checking permissions', error: error.message });
        }
    };
};

//Check if employee manages the specific store
const managesStore = async (req, res, next) => {
    try {
        const storeId = req.params.storeId || req.body.store_id;
        if (!storeId) {
            return res.status(400).json({ success: false, message: 'Store ID is required' });
        }

        if (req.userType === 'storeOwner') {
            const owner = await StoreOwner.findById(req.user._id);
            if (owner?.stores.includes(storeId)) return next();
        }

        if (req.userType === 'employee' && req.user.store_id?.toString() === storeId.toString()) {
            return next();
        }

        return res.status(403).json({ success: false, message: 'Access denied. You do not manage this store.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error checking store access', error: error.message });
    }
};

//Check if user can view specific invoice
const canViewInvoice = async (req, res, next) => {
    try {
        const invoiceId = req.params.id || req.params.invoiceId;
        if (!invoiceId) {
            return res.status(400).json({ success: false, message: 'Invoice ID is required' });
        }

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        if (req.userType === 'storeOwner') {
            const owner = await StoreOwner.findById(req.user._id);
            if (owner?.stores.includes(invoice.store_id)) return next();
        }

        if (req.userType === 'employee' && req.user.store_id?.toString() === invoice.store_id.toString()) {
            return next();
        }

        if (req.userType === 'customer' && invoice.customer_id?.toString() === req.user._id.toString()) {
            return next();
        }

        if (req.userType === 'supplier') {
            const po = await PurchaseOrder.findOne({ supplier_id: req.user._id, _id: invoice.purchaseOrder_id });
            if (po) return next();
        }

        return res.status(403).json({ success: false, message: 'Access denied. You cannot view this invoice.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error checking invoice access', error: error.message });
    }
};

//Check if supplier can access purchase order
const canAccessPurchaseOrder = async (req, res, next) => {
    try {
        const poId = req.params.id || req.params.poId;
        if (!poId) {
            return res.status(400).json({ success: false, message: 'Purchase Order ID is required' });
        }

        const po = await PurchaseOrder.findById(poId);
        if (!po) {
            return res.status(404).json({ success: false, message: 'Purchase Order not found' });
        }

        if (req.userType === 'storeOwner' && po.owner_id?.toString() === req.user._id.toString()) {
            return next();
        }

        if (req.userType === 'supplier' && po.supplier_id?.toString() === req.user._id.toString()) {
            return next();
        }

        return res.status(403).json({ success: false, message: 'Access denied. You cannot access this purchase order.' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error checking purchase order access', error: error.message });
    }
};

//Log activity for audit trail
const logActivity = (action, resource) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                ActivityLog.create({
                    user_id: req.user._id,
                    userType: req.userType,
                    action,
                    resource,
                    resourceId: req.params.id || data?.data?._id,
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                        body: req.body,
                        query: req.query
                    },
                    ipAddress: req.ip || req.connection.remoteAddress
                }).catch(err => console.error('Failed to log activity:', err));
            }
            return originalJson(data);
        };

        next();
    };
};

// 🔹 Owner only
const ownerOnly = (req, res, next) => {
    if (req.userType !== 'storeOwner') {
        return res.status(403).json({ success: false, message: 'Access denied. Store owners only.' });
    }
    next();
};

// 🔹 Supplier only
const supplierOnly = (req, res, next) => {
    if (req.userType !== 'supplier') {
        return res.status(403).json({ success: false, message: 'Access denied. Suppliers only.' });
    }
    next();
};

module.exports = {
    hasRole,
    hasPermission,
    managesStore,
    canViewInvoice,
    canAccessPurchaseOrder,
    logActivity,
    ownerOnly,
    supplierOnly
};
