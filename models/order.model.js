// models/order.model.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order_date: { type: Date, default: Date.now },
    total_amount: { type: Number, required: true },
    shipping_address: { type: Object, required: true }, 
    fulfillment_status: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    items: [{ // Embedded product snapshot
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price_at_sale: Number, 
        merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);