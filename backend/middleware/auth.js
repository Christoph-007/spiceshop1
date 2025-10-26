// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and check user role.
 * @param {Array<string>} roles - Array of roles allowed (e.g., ['admin', 'merchant'])
 */
module.exports = (roles = []) => (req, res, next) => {
    // Get token from header (Format: Bearer <token>)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify and decode the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Attach {id, role} to req.user

        // Check if the user's role is included in the allowed roles array
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role permissions.' });
        }

        next();
    } catch (e) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};