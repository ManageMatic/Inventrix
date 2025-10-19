const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true,
        unique: true
    },
    store: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Store", required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    category: String,
    price: { 
        type: Number, 
        required: true 
    },
    quantity: { 
        type: Number, 
        default: 0 
    },
    imageUrl: String,
    description: String,
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
