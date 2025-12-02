const express = require('express');
const router = express.Router();
const {
    upload,
    uploadAttachmentController,
    getAttachmentsController,
    deleteAttachmentController
} = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to upload routes
router.use(uploadLimiter);

// Upload attachment
router.post('/attachment', verifyToken, upload.single('file'), uploadAttachmentController);

// Get attachments for a request
router.get('/attachments/:requestId', verifyToken, getAttachmentsController);

// Delete attachment
router.delete('/attachment/:id', verifyToken, deleteAttachmentController);

module.exports = router;
