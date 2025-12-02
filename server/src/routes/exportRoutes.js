const express = require('express');
const router = express.Router();
const {
    generateRequestPDFController,
    exportRequestsController,
    exportVehiclesController,
    exportAnalyticsController
} = require('../controllers/exportController');
const { verifyToken } = require('../middleware/auth');
const { isAdmin, canApprove } = require('../middleware/roleCheck');
const { exportLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all export routes
router.use(exportLimiter);

// PDF generation
router.get('/pdf/request/:id', verifyToken, generateRequestPDFController);

// Excel exports
router.get('/excel/requests', verifyToken, canApprove, exportRequestsController);
router.get('/excel/vehicles', verifyToken, isAdmin, exportVehiclesController);
router.get('/excel/analytics', verifyToken, isAdmin, exportAnalyticsController);

module.exports = router;
