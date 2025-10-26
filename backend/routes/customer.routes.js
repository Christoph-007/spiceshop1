// routes/customer.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');

// 1. GET /api/products (Public Catalog with Filters)
router.get('/products', async (req, res) => {
    const { search, category, sort } = req.query;
    let query = {};
    let sortOptions = { name: 1 }; // Default sort by name

    if (search) query.name = { $regex: search, $options: 'i' };
    if (category && category !== 'all') query.category = category;
    
    if (sort === 'price-low') sortOptions = { price: 1 };
    else if (sort === 'price-high') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating_average: -1 };
    
    try {
        // Only show products from approved merchants (implied if you filter merchants)
        // For simplicity, we fetch all products here and assume cleanup/pre-filtering is done elsewhere.
        const products = await Product.find(query).sort(sortOptions);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
});

// 2. GET /api/users/me/profile (Protected)
router.get('/users/me/profile', auth(['customer', 'merchant', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -cart -wishlist');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
});

// 3. PUT /api/users/me/profile (Protected)
router.put('/users/me/profile', auth(['customer']), async (req, res) => {
    const { name, addresses } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (name) user.name = name;
        if (addresses) user.addresses = addresses; // Update entire address list

        await user.save();
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update profile.' });
    }
});

// 4. POST /api/users/me/cart (Protected, Add/Update Cart)
router.post('/users/me/cart', auth(['customer']), async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity });
        }
        await user.save();
        res.json(user.cart);
    } catch (err) {
        res.status(500).json({ message: 'Could not update cart.' });
    }
});

// 5. POST /api/orders (Protected, Checkout)
router.post('/orders', auth(['customer']), async (req, res) => {
    const { shippingAddress } = req.body;
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user || user.cart.length === 0) return res.status(400).json({ message: 'Cart is empty.' });

        const totalAmount = user.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        const orderItems = user.cart.map(item => ({
            product_id: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            price_at_sale: item.product.price,
            merchant_id: item.product.merchant_id,
        }));

        const newOrder = new Order({
            customer_id: req.user.id,
            total_amount: totalAmount,
            shipping_address: shippingAddress,
            items: orderItems,
            // For simple demo, we don't worry about multi-merchant orders here
            merchant_id: orderItems[0].merchant_id 
        });

        await newOrder.save();
        user.cart = []; // Clear the cart
        await user.save();

        res.status(201).json({ message: 'Order placed successfully.', id: newOrder._id });

    } catch (err) {
        res.status(500).json({ message: 'Checkout failed due to server error.' });
    }
});

// 6. GET /api/users/me/orders (Protected, Customer Order History)
router.get('/users/me/orders', auth(['customer']), async (req, res) => {
    try {
        const orders = await Order.find({ customer_id: req.user.id }).sort({ order_date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve order history.' });
    }
});

// ⚠️ You'll need to add routes for GET/DELETE cart items and all Wishlist operations.

// 7. GET /api/users/me/cart (Protected) - return populated cart
router.get('/users/me/cart', auth(['customer']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.json(user.cart || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch cart.' });
    }
});
module.exports = router;