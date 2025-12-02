require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const { PORT, FRONTEND_URL, NODE_ENV } = require('./config/constants');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Thapar Transport Management API',
        version: '1.0.0',
        endpoints: {
            health: '/api/v1/health',
            pdf: '/api/v1/export/pdf/request/:id',
            excel: '/api/v1/export/excel/requests',
            upload: '/api/v1/upload/attachment',
            analytics: '/api/v1/analytics/dashboard'
        }
    });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`📡 API available at http://localhost:${PORT}/api/v1`);
    logger.info(`🌐 CORS enabled for ${FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = app;
