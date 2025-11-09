import React, { useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import Button from '../common/Button';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../utils/constants';
import { isValidFileSize, isValidFileType } from '../../utils/helpers';

const FileUpload = ({ onUploadComplete, existingFiles = [] }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState(existingFiles);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!isValidFileType(selectedFile.type, ALLOWED_FILE_TYPES)) {
      toast.error('Invalid file type. Only PDF and images are allowed.');
      return;
    }

    // Validate file size
    if (!isValidFileSize(selectedFile.size, MAX_FILE_SIZE)) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to Cloudinary
      const { url, error } = await uploadToCloudinary(selectedFile);

      if (error) {
        toast.error('Failed to upload file');
        return;
      }

      const fileData = {
        file_url: url,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
      };

      setFiles((prev) => [...prev, fileData]);
      onUploadComplete(fileData);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Attachments (Optional)
      </label>

      {/* Upload Button */}
      <div className="mb-3">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          <Button
            as="span"
            variant="outline"
            icon={Upload}
            disabled={uploading}
            loading={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          PDF, JPG, PNG (Max 5MB)
        </p>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.file_type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(index)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;