// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user.model');

// Middleware to ensure the user is an authenticated admin
router.use(auth(['admin'])); 

// 1. GET /api/admin/merchants (List merchants for approval)
router.get('/merchants', async (req, res) => {
    const status = req.query.status; 
    let query = { role: 'merchant' };

    if (status === 'pending') {
        query.is_approved = false;
    }
    
    try {
        const merchants = await User.find(query).select('-password');
        res.json(merchants);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve merchant list.' });
    }
});

// 2. PUT /api/admin/merchants/:id/approve (Approve a Merchant)
router.put('/merchants/:id/approve', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'merchant' },
            { is_approved: true },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'Merchant not found.' });
        res.json({ message: `${user.username} approved successfully.`, user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to approve merchant.' });
    }
});

// 3. DELETE /api/admin/merchants/:id (Remove/Reject a Merchant)
router.delete('/merchants/:id', async (req, res) => {
    try {
        const user = await User.findOneAndDelete({ _id: req.params.id, role: 'merchant' });
        if (!user) return res.status(404).json({ message: 'Merchant not found.' });
        res.json({ message: `Merchant ${user.username} removed.` });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove merchant.' });
    }
});

module.exports = router;