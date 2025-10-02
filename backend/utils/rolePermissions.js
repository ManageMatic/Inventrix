const defaultRolePermissions = {
    admin: {
        name: 'admin',
        description: 'Full system access with all permissions',
        permissions: [
            { resource: 'employees', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'store_owners', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'stores', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'sales', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'invoices', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'purchase_orders', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'activity_logs', actions: ['read'] }, // Audit only
            { resource: 'roles', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'reports', actions: ['read'] }
        ]
    },

    employee: {
        name: 'employee',
        description: 'Employee access for retail operations',
        permissions: [
            { resource: 'products', actions: ['create', 'read', 'update'] },
            { resource: 'inventory', actions: ['create', 'read', 'update'] },
            { resource: 'sales', actions: ['create', 'read', 'update'] },
            { resource: 'customers', actions: ['create', 'read', 'update'] },
            { resource: 'suppliers', actions: ['read'] },
            { resource: 'invoices', actions: ['read'] },
            { resource: 'reports', actions: ['read'] }
        ]
    },

    store_owner: {
        name: 'store_owner',
        description: 'Store owner with full access to their stores',
        permissions: [
            { resource: 'employees', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'stores', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'sales', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'customers', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'suppliers', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'invoices', actions: ['read'] },
            { resource: 'purchase_orders', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'reports', actions: ['read'] }
        ]
    },

    supplier: {
        name: 'supplier',
        description: 'Supplier can view and respond to purchase orders',
        permissions: [
            { resource: 'purchase_orders', actions: ['read', 'update'] }, // Accept/Reject
            { resource: 'products', actions: ['read'] },
            { resource: 'invoices', actions: ['read'] } // Only their invoices
        ]
    },

    customer: {
        name: 'customer',
        description: 'Customer can view their purchases',
        permissions: [
            { resource: 'products', actions: ['read'] },
            { resource: 'sales', actions: ['read'] }, // Their sales only
            { resource: 'invoices', actions: ['read'] } // Their invoices only
        ]
    }
};

module.exports = defaultRolePermissions;
