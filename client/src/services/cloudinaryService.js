import api from './api';

/**
 * Uploads an attachment for a specific transport request via the backend API.
 * The backend handles secure Cloudinary upload and saves metadata to the database.
 * 
 * @param {File} file - The file to upload.
 * @param {string} requestId - The ID of the transport request this file belongs to.
 * @returns {Promise<{data: object, error: string|null}>}
 */
export const uploadAttachment = async (file, requestId) => {
  try {
    if (!file || !requestId) {
      throw new Error('File and Request ID are required for upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', requestId);

    const response = await api.post('/upload/attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Optional: Add upload progress tracking if needed
    });

    return {
      data: response.data.data.attachment,
      error: null,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      data: null,
      error: error.message || 'Upload failed. Please try again.',
    };
  }
};

/**
 * Deletes an attachment by its ID via the backend API.
 * 
 * @param {string} attachmentId - The ID of the attachment to delete.
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    if (!attachmentId) {
      throw new Error('Attachment ID is required for deletion');
    }

    await api.delete(`/upload/attachment/${attachmentId}`);

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error('Deletion failed:', error);
    return {
      success: false,
      error: error.message || 'Deletion failed. Please try again.',
    };
  }
};