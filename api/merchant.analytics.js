// Add to merchant.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

router.use(auth(['merchant']));

// Analytics Endpoints
router.get('/analytics/sales', async (req, res) => {
    try {
        const startDate = new Date(req.query.start || new Date().setDate(new Date().getDate() - 30));
        const endDate = new Date(req.query.end || new Date());

        const orders = await Order.aggregate([
            {
                $unwind: '$items'
            },
            {
                $match: {
                    'items.merchant_id': req.user.id,
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$order_date' }
                    },
                    totalSales: { $sum: { $multiply: ['$items.price_at_sale', '$items.quantity'] } },
                    ordersCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch sales analytics.' });
    }
});

router.get('/analytics/products', async (req, res) => {
    try {
        const products = await Product.find({ merchant_id: req.user.id })
            .select('name stock_quantity rating_average review_count')
            .sort('-review_count');

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch product analytics.' });
    }
});

module.exports = router;