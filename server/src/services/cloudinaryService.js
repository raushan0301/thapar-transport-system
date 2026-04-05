const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const { supabaseAdmin } = require('../config/database');
const { ValidationError } = require('../utils/errorTypes');
const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('../config/constants');

/**
 * Upload file to Cloudinary
 */
const uploadFile = async (file, folder = 'transport-attachments') => {
    // Validate file
    if (!file) {
        throw new ValidationError('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        throw new ValidationError('Invalid file type. Allowed types: JPEG, PNG, PDF');
    }

    try {
        // Determine resource type: images as 'image', others as 'raw'
        // This avoids 401 errors on some accounts that have PDF-to-image conversion disabled
        const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('pdf');
        const resourceType = isImage ? 'image' : 'raw';

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: resourceType,
                    // allowed_formats is less critical for raw but good for security
                    ...(isImage && { allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] })
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(file.buffer);
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || file.originalname.split('.').pop(),
            size: result.bytes,
            width: result.width,
            height: result.height,
            resource_type: result.resource_type
        };
    } catch (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }
};

/**
 * Upload image with thumbnail generation
 */
const uploadImage = async (file, folder = 'transport-attachments') => {
    // Validate image
    if (!file.mimetype.startsWith('image/')) {
        throw new ValidationError('File must be an image');
    }

    try {
        // Generate thumbnail
        const thumbnailBuffer = await sharp(file.buffer)
            .resize(200, 200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Upload original
        const original = await uploadFile(file, folder);

        // Upload thumbnail
        const thumbnailFile = {
            ...file,
            buffer: thumbnailBuffer,
            mimetype: 'image/jpeg'
        };

        const thumbnail = await uploadFile(thumbnailFile, `${folder}/thumbnails`);

        return {
            original,
            thumbnail
        };
    } catch (error) {
        throw new Error(`Image upload failed: ${error.message}`);
    }
};

/**
 * Delete file from Cloudinary
 */
const deleteFile = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error(`File deletion failed: ${error.message}`);
    }
};

/**
 * Save attachment metadata to database
 */
const saveAttachmentMetadata = async (requestId, fileData, uploadedBy) => {
    const { data, error } = await supabaseAdmin
        .from('attachments')
        .insert([
            {
                request_id: requestId,
                file_url: fileData.url,
                file_name: fileData.originalName || 'attachment',
                file_type: fileData.format,
                file_size: fileData.size,
                uploaded_by: uploadedBy
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('DB insert error:', error);
        // If database save fails, delete from Cloudinary
        if (fileData.publicId) await deleteFile(fileData.publicId);
        throw new Error(`Failed to save attachment metadata: ${error.message}`);
    }

    return data;
};

/**
 * Get attachments for a request
 */
const getRequestAttachments = async (requestId) => {
    const { data, error } = await supabaseAdmin
        .from('attachments')
        .select('*')
        .eq('request_id', requestId);

    if (error) {
        console.error('Fetch attachments error:', error);
        throw new Error(`Failed to fetch attachments: ${error.message}`);
    }

    return data || [];
};

/**
 * Delete attachment (from both Cloudinary and database)
 */
const deleteAttachment = async (attachmentId, userId, userRole = 'user') => {
    // Fetch attachment
    const { data: attachment, error: fetchError } = await supabaseAdmin
        .from('attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

    if (fetchError || !attachment) {
        throw new Error('Attachment not found');
    }

    // Role verification: user must either own the attachment or be an admin/manager to delete it.
    if (attachment.uploaded_by !== userId && userRole !== 'admin' && userRole !== 'registrar') {
        throw new Error('Unauthorized to delete this attachment');
    }

    // Delete from Cloudinary
    if (attachment.cloudinary_public_id) {
        await deleteFile(attachment.cloudinary_public_id);
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

    if (deleteError) {
        throw new Error('Failed to delete attachment from database');
    }

    return { success: true };
};

module.exports = {
    uploadFile,
    uploadImage,
    deleteFile,
    saveAttachmentMetadata,
    getRequestAttachments,
    deleteAttachment
};
