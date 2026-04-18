const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        product_id: {
            type: String,
            required: true,
            unique: true
        },

        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        category: String,

        purchasePrice: {
            type: Number,
            required: true
        },

        sellingPrice: {
            type: Number,
            required: true
        },

        quantity: {
            type: Number,
            default: 0
        },

        qr_code: {
            type: String,
            unique: true,
            sparse: true
        },

        reorderLevel: {
            type: Number,
            default: 0
        },

        description: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);