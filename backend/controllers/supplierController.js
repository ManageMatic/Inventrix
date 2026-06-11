const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Store = require('../models/Store');
const bcrypt = require('bcryptjs');
const SupplierProduct = require('../models/SupplierProduct');

// ── Store Owner Operations ───────────────────────────────────

// Add Supplier
exports.addSupplier = async (req, res) => {
    try {
        const { name, email, contact, address, password } = req.body;
        const owner_id = req.user._id;

        const existing = await Supplier.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Supplier with this email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password || 'supplier123', 10);
        const supplier_id = `SUP-${Date.now()}`;

        const newSupplier = await Supplier.create({
            supplier_id,
            name,
            email,
            contact,
            address,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: 'Supplier added successfully',
            data: newSupplier
        });
    } catch (error) {
        console.error('ADD SUPPLIER ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to add supplier', error: error.message });
    }
};

// Retrieve suppliers list for store owner
exports.getSuppliersForOwner = async (req, res) => {
    try {
        const suppliers = await Supplier.find().select('-password');
        res.status(200).json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        console.error('GET OWNER SUPPLIERS ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch suppliers', error: error.message });
    }
};

// Create Purchase Order
exports.createPurchaseOrder = async (req, res) => {
    try {
        const { store_id, supplier_id, items, expectedDeliveryDate, notes } = req.body;
        const owner_id = req.user._id;

        if (!store_id || !supplier_id || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Store, Supplier and Items are required' });
        }

        // Verify supplier exists
        const supplier = await Supplier.findById(supplier_id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        for (const item of items) {
            const exists = await SupplierProduct.findOne({ _id: item.product_id, supplier_id });
            if (!exists) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Supplier does not supply the product: ${item.productName}` 
                });
            }
        }

        const po_id = `PO-${Date.now()}`;

        // Compute total PO amount
        let totalAmount = 0;
        const poItems = items.map(item => {
            const totalPrice = (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0);
            totalAmount += totalPrice;
            return {
                product_id: item.product_id,
                productName: item.productName,
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unitPrice) || 0,
                totalPrice
            };
        });

        const newPO = await PurchaseOrder.create({
            po_id,
            store_id,
            supplier_id,
            owner_id,
            items: poItems,
            totalAmount,
            expectedDeliveryDate,
            notes,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Purchase order created successfully',
            data: newPO
        });
    } catch (error) {
        console.error('CREATE PO ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to create purchase order', error: error.message });
    }
};

// Retrieve POs sent by owner
exports.getOwnerPOs = async (req, res) => {
    try {
        const owner_id = req.user._id;
        const pos = await PurchaseOrder.find({ owner_id })
            .populate('store_id', 'name')
            .populate('supplier_id', 'name email contact')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: pos
        });
    } catch (error) {
        console.error('GET OWNER POS ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase orders', error: error.message });
    }
};

// ── Supplier Operations ───────────────────────────────────────

// Get Supplier Dashboard Stats
exports.getSupplierDashboard = async (req, res) => {
    try {
        const supplier_id = req.user._id;

        const totalOrders = await PurchaseOrder.countDocuments({ supplier_id });
        const pendingDeliveries = await PurchaseOrder.countDocuments({ supplier_id, status: 'accepted' });
        const completedDeliveries = await PurchaseOrder.countDocuments({ supplier_id, status: 'delivered' });
        const pendingApproval = await PurchaseOrder.countDocuments({ supplier_id, status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingDeliveries,
                completedDeliveries,
                pendingApproval
            }
        });
    } catch (error) {
        console.error('GET SUPPLIER DASHBOARD ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics', error: error.message });
    }
};

// Get POs sent to supplier
exports.getSupplierPOs = async (req, res) => {
    try {
        const supplier_id = req.user._id;
        const pos = await PurchaseOrder.find({ supplier_id })
            .populate('store_id', 'name address contact')
            .populate('owner_id', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: pos
        });
    } catch (error) {
        console.error('GET SUPPLIER POS ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch purchase orders', error: error.message });
    }
};

// Supplier accepts, rejects or marks PO as delivered
exports.updatePOStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message, expectedDeliveryDate } = req.body;
        const supplier_id = req.user._id;

        const po = await PurchaseOrder.findOne({ _id: id, supplier_id });
        if (!po) {
            return res.status(404).json({ success: false, message: 'Purchase order not found' });
        }

        if (status) po.status = status;

        po.supplierResponse = {
            message: message || po.supplierResponse?.message,
            respondedAt: new Date()
        };

        if (expectedDeliveryDate) {
            po.expectedDeliveryDate = expectedDeliveryDate;
        }

        if (status === 'delivered') {
            po.actualDeliveryDate = new Date();

            // 🔥 INCREMENT STOCK IN STORE UPON DELIVERY OR AUTO-CREATE PRODUCT!
            for (const item of po.items) {
                if (item.product_id) {
                    const supProd = await SupplierProduct.findById(item.product_id);
                    if (supProd) {
                        // Look for product in store with same name
                        let storeProduct = await Product.findOne({
                            store: po.store_id,
                            name: supProd.name
                        });

                        if (storeProduct) {
                            // Product exists, increment quantity
                            storeProduct.quantity += item.quantity;
                            await storeProduct.save();
                        } else {
                            // Product does not exist, create it and generate QR!
                            const product_id = `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
                            const qr_code = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

                            await Product.create({
                                product_id,
                                store: po.store_id,
                                name: supProd.name,
                                category: supProd.category || "General",
                                purchasePrice: supProd.purchasePrice,
                                sellingPrice: supProd.purchasePrice * 1.25, // default 25% markup
                                quantity: item.quantity,
                                qr_code,
                                description: supProd.description || `Delivered by supplier on ${new Date().toLocaleDateString()}`
                            });
                        }
                    }
                }
            }
        }

        await po.save();

        res.status(200).json({
            success: true,
            message: `Purchase order updated to: ${status}`,
            data: po
        });
    } catch (error) {
        console.error('UPDATE PO STATUS ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to update purchase order', error: error.message });
    }
};

// Get Supplier Supplied Products (Supplier registers products they offer to stores)
exports.getSuppliedProducts = async (req, res) => {
    try {
        const supplier_id = req.user._id;

        // Fetch supplier and populate products they supply
        const supplier = await Supplier.findById(supplier_id).populate('productsSupplied');
        
        // Find general products that are marked as supplied or fetch all products
        const allProducts = await Product.find().populate('store', 'name');

        res.status(200).json({
            success: true,
            data: {
                supplied: supplier?.productsSupplied || [],
                allAvailable: allProducts
            }
        });
    } catch (error) {
        console.error('GET SUPPLIED PRODUCTS ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
    }
};

// Add product to supply list
exports.supplyProduct = async (req, res) => {
    try {
        const { product_id } = req.body;
        const supplier_id = req.user._id;

        const supplier = await Supplier.findById(supplier_id);
        if (!supplier.productsSupplied.includes(product_id)) {
            supplier.productsSupplied.push(product_id);
            await supplier.save();
        }

        res.status(200).json({
            success: true,
            message: 'Product added to supply list successfully',
            data: supplier.productsSupplied
        });
    } catch (error) {
        console.error('SUPPLY PRODUCT ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to add product to supply list', error: error.message });
    }
};

// Add product to supplier catalog
exports.addCatalogProduct = async (req, res) => {
    try {
        const { name, category, description, purchasePrice } = req.body;
        const supplier_id = req.user._id;

        if (!name || !purchasePrice) {
            return res.status(400).json({ success: false, message: 'Name and Purchase Price are required' });
        }

        const newProduct = await SupplierProduct.create({
            name,
            category,
            description,
            purchasePrice: Number(purchasePrice),
            supplier_id
        });

        res.status(201).json({
            success: true,
            message: 'Catalog product added successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('ADD CATALOG PRODUCT ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to add catalog product', error: error.message });
    }
};

// Fetch catalog products for supplier
exports.getCatalogProducts = async (req, res) => {
    try {
        const supplier_id = req.user._id;
        const products = await SupplierProduct.find({ supplier_id });
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('GET CATALOG PRODUCTS ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch catalog products', error: error.message });
    }
};

// Fetch catalog products of a specific supplier for store owner
exports.getCatalogProductsForOwner = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const products = await SupplierProduct.find({ supplier_id: supplierId });
        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('GET CATALOG PRODUCTS FOR OWNER ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch catalog products', error: error.message });
    }
};
