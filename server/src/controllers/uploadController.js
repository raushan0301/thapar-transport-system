const multer = require('multer');
const { uploadFile, uploadImage, saveAttachmentMetadata, getRequestAttachments, deleteAttachment } = require('../services/cloudinaryService');
const { successResponse } = require('../utils/responseFormatter');
const { ValidationError, NotFoundError } = require('../utils/errorTypes');
const { supabaseAdmin } = require('../config/database');

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

        // IDOR Protection: Prevent users from uploading attachments to other people's requests
        if (req.profile.role === 'user') {
            const { data: reqCheck, error: checkErr } = await supabaseAdmin
                .from('transport_requests')
                .select('user_id')
                .eq('id', requestId)
                .single();
            
            if (checkErr || !reqCheck) throw new NotFoundError('Transport request not found');
            if (reqCheck.user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized to upload attachments to this request' });
            }
        }

        // Determine if it's an image
        const isImage = req.file.mimetype.startsWith('image/');

        let uploadResult;
        if (isImage) {
            uploadResult = await uploadImage(req.file);
        } else {
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
 * Upload file to Cloudinary immediately (no DB, no requestId needed).
 * Returns file metadata that can be linked to a request later.
 */
const uploadTempController = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ValidationError('No file uploaded');
        }

        const isImage = req.file.mimetype.startsWith('image/');

        let result;
        if (isImage) {
            const uploadResult = await uploadImage(req.file);
            result = {
                file_url: uploadResult.original.url,
                file_name: req.file.originalname,
                file_type: uploadResult.original.format,
                file_size: uploadResult.original.size,
                public_id: uploadResult.original.publicId,
                thumbnail_url: uploadResult.thumbnail?.url || null
            };
        } else {
            const uploadResult = await uploadFile(req.file);
            result = {
                file_url: uploadResult.url,
                file_name: req.file.originalname,
                file_type: uploadResult.format,
                file_size: uploadResult.size,
                public_id: uploadResult.publicId,
                thumbnail_url: null
            };
        }

        successResponse(res, { file: result }, 'File uploaded to cloud successfully', 200);
    } catch (error) {
        next(error);
    }
};

/**
 * Link a pre-uploaded Cloudinary file to a transport request (saves to DB).
 */
const linkAttachmentController = async (req, res, next) => {
    try {
        const { requestId, file_url, file_name, file_type, file_size } = req.body;

        if (!requestId || !file_url || !file_name) {
            throw new ValidationError('requestId, file_url, and file_name are required');
        }

        const attachment = await saveAttachmentMetadata(
            requestId,
            {
                url: file_url,
                originalName: file_name,
                format: file_type || 'unknown',
                size: file_size || 0
            },
            req.user.id
        );

        successResponse(res, { attachment }, 'Attachment linked to request', 201);
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

        // IDOR Protection for attachments
        if (req.profile.role === 'user') {
            const { data: reqCheck, error: checkErr } = await supabaseAdmin
                .from('transport_requests')
                .select('user_id')
                .eq('id', requestId)
                .single();
            
            if (checkErr || !reqCheck) throw new NotFoundError('Transport request not found');
            if (reqCheck.user_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Unauthorized to view attachments for this request' });
            }
        }

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

        await deleteAttachment(id, req.user.id, req.profile?.role);

        successResponse(res, null, 'Attachment deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Upload profile image
 */
const uploadProfileImageController = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ValidationError('No file uploaded');
        }

        const isImage = req.file.mimetype.startsWith('image/');
        if (!isImage) {
            throw new ValidationError('File must be an image');
        }

        // Upload with thumbnail
        const uploadResult = await uploadImage(req.file, 'user-profiles');
        
        // Update user avatar in db
        const avatarUrl = uploadResult.thumbnail || uploadResult.original.url;
        
        const { error } = await supabaseAdmin
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', req.user.id);
            
        if (error) {
            console.error('Failed to update avatar_url in users table:', error);
        }

        successResponse(res, {
            avatar_url: avatarUrl
        }, 'Profile image uploaded successfully', 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload,
    uploadAttachmentController,
    uploadTempController,
    linkAttachmentController,
    getAttachmentsController,
    deleteAttachmentController,
    uploadProfileImageController
};
