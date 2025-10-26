// Add to admin.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/order.model');
const User = require('../models/user.model');

router.use(auth(['admin']));

// Overall Analytics
router.get('/analytics/sales', async (req, res) => {
    try {
        const startDate = new Date(req.query.start || new Date().setDate(new Date().getDate() - 30));
        const endDate = new Date(req.query.end || new Date());

        const salesData = await Order.aggregate([
            {
                $match: {
                    order_date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$order_date' }
                    },
                    totalSales: { $sum: '$total_amount' },
                    ordersCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(salesData);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch sales analytics.' });
    }
});

router.get('/analytics/users', async (req, res) => {
    try {
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    active: {
                        $sum: {
                            $cond: [
                                { $gt: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        res.json(userStats);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user statistics.' });
    }
});

module.exports = router;