const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.createSale = async (req, res) => {
    try {
        const { items, store_id, subtotal, totalAmount, customer_mobile } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty",
            });
        }

        if (!store_id) {
            return res.status(400).json({
                success: false,
                message: "Store ID is required",
            });
        }

        if (!subtotal || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Subtotal and total amount are required",
            });
        }

        console.log("Cart data:", items); // 🔥 THIS LINE IS IMPORTANT

        for (let item of items) {

            if (!item._id) {
                throw new Error("Product ID missing");
            }

            const product = await Product.findById(item._id);

            if (!product) {
                throw new Error("Product not found");
            }

            const qty = Number(item.qty) || 1;

            if (product.quantity < qty) {
                throw new Error(`Not enough stock for ${product.name}`);
            }

            product.quantity -= qty;
            await product.save();
        }

        // Handle customer
        let customer = null;
        if (customer_mobile) {
            customer = await Customer.findOneAndUpdate(
                { phone: customer_mobile },
                {
                    $set: { phone: customer_mobile },
                    $setOnInsert: {
                        customer_id: `CUST-${customer_mobile}-${Date.now()}`,
                        name: "Walk-in Customer",
                        isRegistered: false,
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        // Transform items to match Sale schema
        const saleItems = items.map(item => ({
            product_id: item._id,
            quantity: item.qty,
            price: item.sellingPrice,
            subtotal: item.qty * item.sellingPrice
        }));

        const sale = new Sale({
            sale_id: "SALE-" + Date.now(),
            store_id: store_id,
            employee_id: req.userType === 'employee' ? req.user._id : null,
            store_owner_id: req.userType === 'store_owner' ? req.user._id : null,
            customer_mobile: customer_mobile || null,
            items: saleItems,
            subtotal: subtotal,
            totalAmount: totalAmount,
            paymentMethod: "cash",
        });

        await sale.save();

        // Update employee performance if applicable
        if (req.userType === 'employee') {
            const Employee = require("../models/Employee");
            await Employee.findByIdAndUpdate(req.user._id, {
                $inc: { 
                    "performance.salesCount": 1,
                    "performance.totalRevenue": totalAmount
                }
            });
        }

        res.json({
            success: true,
            message: "Sale completed",
            data: sale,
        });
        console.log("BODY:", req.body); // 🔥 THIS LINE IS IMPORTANT
        console.log("SALE CREATED:", sale); // 🔥 THIS LINE IS IMPORTANT

    } catch (error) {
        console.error("SALE ERROR:", error); // 🔥 THIS LINE IS IMPORTANT
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all sales for a store
exports.getSalesByStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { limit = 50, page = 1, timeframe } = req.query;

        const skip = (page - 1) * limit;

        let query = {};
        if (storeId === "All" || storeId === "undefined") {
            const Store = require('../models/Store');
            const owner_id = req.user._id;
            const stores = await Store.find({ owner_id }).select('_id');
            const storeIds = stores.map(s => s._id);
            query = { store_id: { $in: storeIds } };
        } else {
            query = { store_id: storeId };
        }

        // 🛡️ RBAC: Employees can only see THEIR OWN sales
        if (req.userType === 'employee') {
            query.employee_id = req.user._id;
        } else if (req.query.employeeId) {
            // Owners can filter by specific employee
            query.employee_id = req.query.employeeId;
        }

        // Apply timeframe filtering
        if (timeframe && timeframe !== 'all') {
            const now = new Date();
            let startDate = new Date();
            if (timeframe === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (timeframe === 'month') {
                startDate.setMonth(now.getMonth() - 1);
            } else if (timeframe === 'year') {
                startDate.setFullYear(now.getFullYear() - 1);
            }
            query.date = { $gte: startDate };
        }

        const sales = await Sale.find(query)
            .populate("store_id", "name")
            .populate("employee_id", "name email")
            .populate("store_owner_id", "name email")
            .sort({ date: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Sale.countDocuments(query);

        res.json({
            success: true,
            data: sales,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        });
    } catch (error) {
        console.error("GET SALES ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single sale by ID
exports.getSaleById = async (req, res) => {
    try {
        const { saleId } = req.params;

        const sale = await Sale.findById(saleId)
            .populate("employee_id", "name email")
            .populate("store_owner_id", "name email")
            .populate("items.product_id", "name sellingPrice");

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        res.json({
            success: true,
            data: sale
        });
    } catch (error) {
        console.error("GET SALE BY ID ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update sale
exports.updateSale = async (req, res) => {
    try {
        const { saleId } = req.params;
        const { paymentMethod, status } = req.body;

        const sale = await Sale.findByIdAndUpdate(
            saleId,
            {
                paymentMethod,
                status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        res.json({
            success: true,
            message: "Sale updated successfully",
            data: sale
        });
    } catch (error) {
        console.error("UPDATE SALE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete sale
exports.deleteSale = async (req, res) => {
    try {
        const { saleId } = req.params;

        const sale = await Sale.findById(saleId);

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        // Restore product quantities
        for (let item of sale.items) {
            await Product.findByIdAndUpdate(
                item.product_id,
                { $inc: { quantity: item.quantity } }
            );
        }

        await Sale.findByIdAndDelete(saleId);

        res.json({
            success: true,
            message: "Sale deleted successfully"
        });
    } catch (error) {
        console.error("DELETE SALE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get recent sales for store dashboard
exports.getRecentSales = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { limit = 5 } = req.query;

        const sales = await Sale.find({ store_id: storeId })
            .populate("items.product_id", "name")
            .sort({ date: -1 })
            .limit(20); // fetch a few recent sales to flatten items from

        // Transform data for frontend
        const recentSales = [];
        for (const sale of sales) {
            for (const item of sale.items) {
                recentSales.push({
                    saleId: sale._id,
                    product: item.product_id?.name || "Unknown",
                    date: new Date(sale.date).toLocaleDateString(),
                    quantity: item.quantity,
                    amount: `₹${item.subtotal}`
                });
                if (recentSales.length >= parseInt(limit)) break;
            }
            if (recentSales.length >= parseInt(limit)) break;
        }

        res.json({
            success: true,
            data: recentSales
        });
    } catch (error) {
        console.error("GET RECENT SALES ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get advanced analytics for store/owner
exports.getAdvancedAnalytics = async (req, res) => {
    try {
        const { storeId } = req.params;
        const mongoose = require('mongoose');

        let matchQuery = { status: 'completed' };
        if (storeId !== "All" && storeId !== "undefined") {
            matchQuery.store_id = new mongoose.Types.ObjectId(storeId);
        } else {
            // If "All", get all stores for this owner
            const Store = require('../models/Store');
            const owner_id = req.user._id;
            const stores = await Store.find({ owner_id }).select('_id');
            const storeIds = stores.map(s => s._id);
            matchQuery.store_id = { $in: storeIds };
        }

        // 1. Top 5 Products by Quantity
        const topProducts = await Sale.aggregate([
            { $match: matchQuery },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product_id",
                    totalQty: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { totalQty: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    name: "$productInfo.name",
                    quantity: "$totalQty",
                    revenue: "$revenue"
                }
            }
        ]);

        // 2. Hourly Sales (Peak Hours)
        const hourlySales = await Sale.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $hour: "$date" },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Category Distribution
        const categoryData = await Sale.aggregate([
            { $match: matchQuery },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $group: {
                    _id: "$productInfo.category",
                    revenue: { $sum: "$items.subtotal" },
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                topProducts,
                hourlySales: Array.from({ length: 24 }, (_, i) => {
                    const hourData = hourlySales.find(h => h._id === i);
                    return {
                        hour: `${i}:00`,
                        sales: hourData ? hourData.count : 0,
                        revenue: hourData ? hourData.revenue : 0
                    };
                }),
                categoryDistribution: categoryData.map(c => ({
                    category: c._id || "Uncategorized",
                    revenue: c.revenue,
                    count: c.count
                }))
            }
        });

    } catch (error) {
        console.error("GET ADVANCED ANALYTICS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};