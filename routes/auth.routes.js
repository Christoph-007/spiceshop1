// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Helper function to generate JWT
const generateToken = (user) => {
    const payload = { 
        user: { 
            id: user.id, 
            role: user.role,
            email: user.email,
            name: user.name 
        } 
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role, name } = req.body;
        
        // Validate role
        if (!['customer', 'merchant'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            username,
            email,
            password: hashedPassword,
            role,
            name,
            is_approved: role === 'customer' // customers are auto-approved
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        // If merchant, don't send token as they need approval
        if (role === 'merchant') {
            return res.status(201).json({ 
                message: 'Registration successful. Please wait for admin approval.',
                requiresApproval: true
            });
        }

        // For customers, send token and user info
        res.status(201).json({
            token,
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if merchant is approved
        if (user.role === 'merchant' && !user.is_approved) {
            return res.status(403).json({ 
                message: 'Your merchant account is pending approval',
                requiresApproval: true
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user);

        // Send response
        res.json({
            token,
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Verify token and get user info
router.get('/verify', auth(), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ 
            valid: true,
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(500).json({ message: 'Server error during token verification' });
    }
});

module.exports = router;