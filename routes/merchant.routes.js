// routes/merchant.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

// Middleware to ensure the user is an authenticated merchant
router.use(auth(['merchant'])); 

// 1. POST /api/merchant/products (Add New Product)
router.post('/products', async (req, res) => {
    const { name, description, price, stock_quantity, category, image_url, quantity_unit } = req.body;
    try {
        const newProduct = new Product({
            name, description, price, stock_quantity, category, image_url, quantity_unit,
            merchant_id: req.user.id // Product is linked to the logged-in merchant
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add product.', error: err.message });
    }
});

// 2. GET /api/merchant/products (View Merchant's Own Products)
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find({ merchant_id: req.user.id });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch merchant products.' });
    }
});


// 3. PUT /api/merchant/products/:id (Update Product Details)
router.put('/products/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, merchant_id: req.user.id }, // Must own the product
            req.body,
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found or access denied.' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update product.' });
    }
});

// 4. GET /api/merchant/orders (View Orders for their Products)
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find({ 
            'items.merchant_id': req.user.id 
        })
        .populate('customer_id', 'name email addresses') // Get customer info
        .sort({ order_date: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch merchant orders.' });
    }
});

// 5. PUT /api/merchant/orders/:id/status (Update Order Status)
router.put('/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        
        // Ensure this merchant owns at least one item in the order to modify status
        const ownsItem = order.items.some(item => item.merchant_id.toString() === req.user.id);
        if (!ownsItem) return res.status(403).json({ message: 'Access denied to this order.' });
        
        order.fulfillment_status = status;
        // Optionally add a tracking history entry here
        
        await order.save();
        res.json({ message: `Order status updated to ${status}.` });

    } catch (err) {
        res.status(500).json({ message: 'Failed to update order status.' });
    }
});

module.exports = router;