const express = require('express');
const router = express.Router();
const {
    getDashboardAnalytics,
    getVehicleAnalytics
} = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');
const { canApprove } = require('../middleware/roleCheck');

// Dashboard analytics
router.get('/dashboard', verifyToken, canApprove, getDashboardAnalytics);

// Vehicle analytics
router.get('/vehicles', verifyToken, canApprove, getVehicleAnalytics);

module.exports = router;
