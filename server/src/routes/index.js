const express = require('express');
const router = express.Router();

// Import route modules
const exportRoutes = require('./exportRoutes');
const uploadRoutes = require('./uploadRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const userRoutes = require('./userRoutes');
const driverRoutes = require('./driverRoutes');

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

const { verifyToken } = require('../middleware/auth');

// Mount routes
router.use('/export', verifyToken, exportRoutes);
router.use('/upload', verifyToken, uploadRoutes);
router.use('/analytics', verifyToken, analyticsRoutes);
router.use('/users', userRoutes); // Protected internally via optionalAuth & roles
router.use('/driver', verifyToken, driverRoutes);

module.exports = router;
