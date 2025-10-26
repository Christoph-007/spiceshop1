// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. Middleware ---
// Allows frontend to communicate with backend
app.use(cors()); 
// Parses incoming JSON request bodies
app.use(express.json()); 

// Serve frontend static files so frontend can be loaded from the backend origin
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --- 2. Database Connection ---
// Accept either MONGO_URI or MONGODB_URI to avoid env name confusion
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) console.warn('Warning: no MongoDB connection string found in MONGO_URI or MONGODB_URI');
mongoose.connect(mongoUri)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// --- 3. Route Imports ---
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const merchantRoutes = require('./routes/merchant.routes');
const adminRoutes = require('./routes/admin.routes');

// --- 4. Route Wiring ---
// Authentication routes are grouped under /api/auth
app.use('/api/auth', authRoutes);
// General and Customer routes (e.g., public product list, cart)
app.use('/api', customerRoutes); 
app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);

// Simple health check route
// Health check for APIs
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Serve login page at root for convenience (frontend is served statically)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html')));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));