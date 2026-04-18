const Sale = require("../models/Sale");
const Product = require("../models/Product");
const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.createSale = async (req, res) => {
    try {
        const { items, storeId } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty",
            });
        }

        let total = 0;

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

            total += product.sellingPrice * qty;
        }

        const sale = new Sale({
            sale_id: "SALE-" + Date.now(),
            store_id: storeId || null,
            items,
            totalAmount: total,
            paymentMethod: "cash",
        });

        await sale.save();

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