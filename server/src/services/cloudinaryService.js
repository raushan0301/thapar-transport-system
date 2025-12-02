const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const { supabase } = require('../config/database');
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
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'auto',
                    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
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
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height
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
    const { data, error } = await supabase
        .from('attachments')
        .insert([
            {
                request_id: requestId,
                file_url: fileData.url,
                file_name: fileData.originalName || 'attachment',
                file_type: fileData.format,
                file_size: fileData.size,
                cloudinary_public_id: fileData.publicId,
                uploaded_by: uploadedBy
            }
        ])
        .select()
        .single();

    if (error) {
        // If database save fails, delete from Cloudinary
        await deleteFile(fileData.publicId);
        throw new Error('Failed to save attachment metadata');
    }

    return data;
};

/**
 * Get attachments for a request
 */
const getRequestAttachments = async (requestId) => {
    const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error('Failed to fetch attachments');
    }

    return data;
};

/**
 * Delete attachment (from both Cloudinary and database)
 */
const deleteAttachment = async (attachmentId, userId) => {
    // Fetch attachment
    const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

    if (fetchError || !attachment) {
        throw new Error('Attachment not found');
    }

    // Delete from Cloudinary
    if (attachment.cloudinary_public_id) {
        await deleteFile(attachment.cloudinary_public_id);
    }

    // Delete from database
    const { error: deleteError } = await supabase
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
