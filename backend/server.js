// server.js
// Load env from project root, then also fallback to backend/.env if present
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. Middleware ---
// Allows frontend to communicate with backend
app.use(cors()); 
// Parses incoming JSON request bodies
app.use(express.json()); 

// Serve frontend static files so frontend can be loaded from the backend origin
// Disable the default index file so we can explicitly control which HTML is returned at '/'
app.use(express.static(path.join(__dirname, '..', 'frontend'), { index: false }));

// --- 2. Database Connection ---
// Fail fast on model operations when not connected, instead of buffering for 10s
mongoose.set('bufferCommands', false);

// Accept either MONGO_URI or MONGODB_URI to avoid env name confusion
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (mongoUri) {
    mongoose.connect(mongoUri, {
        // Reduce long hangs if URI is wrong/unreachable
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    })
        .then(() => console.log('✅ MongoDB Connected Successfully'))
        .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
    console.warn('Warning: no MongoDB connection string found in MONGO_URI or MONGODB_URI. Starting server without DB connection.');
}

mongoose.connection.on('connected', () => console.log('🟢 Mongoose connected'));
mongoose.connection.on('error', err => console.error('🔴 Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.warn('🟠 Mongoose disconnected'));

// Helper to check DB readiness (0=disconnected, 1=connected)
const isDbConnected = () => mongoose.connection.readyState === 1;

// --- 3. Route Imports ---
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const merchantRoutes = require('./routes/merchant.routes');
const adminRoutes = require('./routes/admin.routes');

// --- 4. Route Wiring ---
// Optional: gate API routes behind DB availability to return a clear error instead of buffering
function requireDb(req, res, next) {
    if (!isDbConnected()) {
        return res.status(503).json({ message: 'Service unavailable: database is not connected' });
    }
    next();
}

// Authentication routes are grouped under /api/auth
app.use('/api/auth', requireDb, authRoutes);
// General and Customer routes (e.g., public product list, cart)
app.use('/api', requireDb, customerRoutes);
app.use('/api/merchant', requireDb, merchantRoutes);
app.use('/api/admin', requireDb, adminRoutes);

// Simple health check route
// Health check for APIs
app.get('/api/health', (req, res) => res.json({ status: 'ok', dbConnected: isDbConnected(), time: new Date() }));

// Serve login page at root for convenience (frontend is served statically)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html')));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));