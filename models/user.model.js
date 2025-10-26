// models/user.model.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, sparse: true }, // Sparse allows nulls if field is not used
    password: { type: String, required: true }, 
    email: { type: String, required: true, unique: true },
    role: { 
        type: String, 
        enum: ['customer', 'merchant', 'admin'], 
        default: 'customer' 
    },
    // Merchant Specific
    is_approved: { 
        type: Boolean, 
        // Default to false only if the role is 'merchant'
        default: function() { return this.role === 'merchant' ? false : true; } 
    },
    // Customer Specific
    name: { type: String },
    addresses: [{
        street: String, city: String, zip: String, country: String
    }],
    cart: [{ 
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);