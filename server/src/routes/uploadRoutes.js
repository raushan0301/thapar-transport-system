const express = require('express');
const router = express.Router();
const {
    upload,
    uploadAttachmentController,
    uploadTempController,
    linkAttachmentController,
    getAttachmentsController,
    deleteAttachmentController,
    uploadProfileImageController
} = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to upload routes
router.use(uploadLimiter);

// Upload attachment directly (with requestId, saves to DB immediately)
router.post('/attachment', verifyToken, upload.single('file'), uploadAttachmentController);

// Upload to Cloudinary only — no DB, no requestId needed (for pre-upload UX flow)
router.post('/temp', verifyToken, upload.single('file'), uploadTempController);

// Link a pre-uploaded file to a request (saves metadata to DB)
router.post('/link', verifyToken, linkAttachmentController);

// Upload profile image
router.post('/profile', verifyToken, upload.single('file'), uploadProfileImageController);

// Get attachments for a request
router.get('/attachments/:requestId', verifyToken, getAttachmentsController);

// Delete attachment
router.delete('/attachment/:id', verifyToken, deleteAttachmentController);

module.exports = router;
