const express = require('express');
const router = express.Router();

// Import route modules
const exportRoutes = require('./exportRoutes');
const uploadRoutes = require('./uploadRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Mount routes
router.use('/export', exportRoutes);
router.use('/upload', uploadRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
