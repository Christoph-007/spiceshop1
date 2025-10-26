// models/product.model.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock_quantity: { type: Number, required: true, min: 0 },
    quantity_unit: { type: String, default: 'grams' }, 
    category: { type: String, required: true },
    image_url: { type: String },
    rating_average: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);