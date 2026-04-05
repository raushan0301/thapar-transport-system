import api from './api';

/**
 * Upload a file to Cloudinary immediately (no requestId needed).
 * Returns cloud metadata to be linked later at form submission.
 */
export const uploadFileTemp = async (file) => {
  try {
    if (!file) throw new Error('File is required');
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/temp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: response.data.data.file, error: null };
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message || 'Upload failed';
    return { data: null, error: msg };
  }
};

/**
 * Link a pre-uploaded file to a transport request (saves to DB).
 */
export const linkAttachment = async (requestId, fileData) => {
  try {
    const response = await api.post('/upload/link', {
      requestId,
      file_url: fileData.file_url,
      file_name: fileData.file_name,
      file_type: fileData.file_type,
      file_size: fileData.file_size,
    });
    return { data: response.data.data.attachment, error: null };
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message || 'Link failed';
    return { data: null, error: msg };
  }
};

/**
 * Uploads an attachment for a specific transport request via the backend API.
 */
export const uploadAttachment = async (file, requestId) => {
  try {
    if (!file || !requestId) throw new Error('File and Request ID are required for upload');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('requestId', requestId);
    const response = await api.post('/upload/attachment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: response.data.data.attachment, error: null };
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message || 'Upload failed';
    return { data: null, error: msg };
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

/**
 * Uploads a profile image for the currently authenticated user.
 * 
 * @param {File} file - The file to upload.
 * @returns {Promise<{data: object, error: string|null}>}
 */
export const uploadProfileImage = async (file) => {
  try {
    if (!file) {
      throw new Error('File is required for upload');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      data: response.data.data,
      error: null,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      data: null,
      error: error.message || 'Profile image upload failed. Please try again.',
    };
  }
};