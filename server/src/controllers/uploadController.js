const multer = require('multer');
const { uploadFile, uploadImage, saveAttachmentMetadata, getRequestAttachments, deleteAttachment } = require('../services/cloudinaryService');
const { successResponse } = require('../utils/responseFormatter');
const { ValidationError } = require('../utils/errorTypes');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * Upload attachment for a request
 */
const uploadAttachmentController = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ValidationError('No file uploaded');
        }

        const { requestId } = req.body;

        if (!requestId) {
            throw new ValidationError('Request ID is required');
        }

        // Determine if it's an image
        const isImage = req.file.mimetype.startsWith('image/');

        let uploadResult;
        if (isImage) {
            // Upload with thumbnail
            uploadResult = await uploadImage(req.file);
        } else {
            // Upload file only
            uploadResult = await uploadFile(req.file);
        }

        // Save metadata to database
        const attachment = await saveAttachmentMetadata(
            requestId,
            {
                url: isImage ? uploadResult.original.url : uploadResult.url,
                publicId: isImage ? uploadResult.original.publicId : uploadResult.publicId,
                format: isImage ? uploadResult.original.format : uploadResult.format,
                size: isImage ? uploadResult.original.size : uploadResult.size,
                originalName: req.file.originalname
            },
            req.user.id
        );

        successResponse(res, {
            attachment,
            ...(isImage && { thumbnail: uploadResult.thumbnail })
        }, 'File uploaded successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get attachments for a request
 */
const getAttachmentsController = async (req, res, next) => {
    try {
        const { requestId } = req.params;

        const attachments = await getRequestAttachments(requestId);

        successResponse(res, attachments, 'Attachments fetched successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete an attachment
 */
const deleteAttachmentController = async (req, res, next) => {
    try {
        const { id } = req.params;

        await deleteAttachment(id, req.user.id);

        successResponse(res, null, 'Attachment deleted successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload,
    uploadAttachmentController,
    getAttachmentsController,
    deleteAttachmentController
};
