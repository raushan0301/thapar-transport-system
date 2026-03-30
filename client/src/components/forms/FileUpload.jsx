/* eslint-disable */
import { useState } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';
import { uploadAttachment, deleteAttachment } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../utils/constants';
import { isValidFileSize, isValidFileType } from '../../utils/helpers';

const FileUpload = ({ onUploadComplete, onFileSelect, onRemove, existingFiles = [], requestId = null }) => {
  const [uploading, setUploading] = useState(false);
  const [localFiles, setLocalFiles] = useState([]); // For files selected but not yet uploaded (used in NewRequest)

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

    // Case 1: If we have a requestId, upload immediately
    if (requestId) {
      setUploading(true);
      try {
        const { data, error } = await uploadAttachment(selectedFile, requestId);

        if (error) {
          toast.error(error);
          return;
        }

        if (onUploadComplete) onUploadComplete(data);
        toast.success('File uploaded successfully');
      } catch (error) {
        toast.error('Failed to upload file');
      } finally {
        setUploading(false);
      }
    } 
    // Case 2: If no requestId, just notify parent of the selected file object
    else {
      setLocalFiles(prev => [...prev, selectedFile]);
      if (onFileSelect) onFileSelect(selectedFile);
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRemove = async (file, index) => {
    // If it's a file that was already uploaded (has an id)
    if (file.id) {
      if (!window.confirm('Are you sure you want to delete this attachment?')) return;
      
      try {
        const { success, error } = await deleteAttachment(file.id);
        if (success) {
          if (onRemove) onRemove(file.id);
          toast.success('Attachment deleted');
        } else {
          toast.error(error);
        }
      } catch (err) {
        toast.error('Failed to delete attachment');
      }
    } 
    // If it's a locally selected file
    else {
      setLocalFiles(prev => prev.filter((_, i) => i !== index));
      if (onRemove) onRemove(index, true); // true indicates local removal
    }
  };

  const getFileIcon = (fileType = '') => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="mb-4">
      {/* Upload Button */}
      <div className="mb-4">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          <div className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${uploading ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/30 border-blue-200 hover:border-blue-400 hover:bg-blue-50'}
          `}>
            <div className="flex flex-col items-center">
              <div className={`p-3 rounded-full mb-3 ${uploading ? 'bg-gray-100' : 'bg-blue-100'}`}>
                <Upload className={`w-6 h-6 ${uploading ? 'text-gray-400' : 'text-blue-600'}`} />
              </div>
              <p className="text-sm font-bold text-gray-900">
                {uploading ? 'Uploading attachment...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {!requestId && localFiles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            Files will be uploaded after you submit the request.
          </p>
        </div>
      )}

      {/* Uploaded / Selected Files List */}
      {(existingFiles.length > 0 || localFiles.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Show server-side files */}
          {existingFiles.map((file, index) => (
            <div
              key={file.id || `ext-${index}`}
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(file.file_type)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {file.file_name}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    {(file.file_size / 1024).toFixed(1)} KB • UPLOADED
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file, index)}
                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                title="Delete attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Show local files */}
          {localFiles.map((file, index) => (
            <div
              key={`local-${index}`}
              className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm animate-pulse"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-900 truncate text-opacity-70">
                    {file.name}
                  </p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase">
                    {(file.size / 1024).toFixed(1)} KB • PENDING
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file, index)}
                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;