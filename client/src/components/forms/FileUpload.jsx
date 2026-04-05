/* eslint-disable */
import { useState } from 'react';
import { Upload, X, FileText, Image, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { uploadFileTemp, deleteAttachment } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../../utils/constants';
import { isValidFileSize, isValidFileType } from '../../utils/helpers';

/**
 * FileUpload component.
 * 
 * Two modes:
 * 1. No requestId → immediately uploads to Cloudinary via /upload/temp, calls onUploadComplete(fileData)
 * 2. With requestId (edit page) → immediate upload + DB link via legacy flow
 * 
 * Props:
 *   onUploadComplete(fileData) — called when a file successfully uploads to Cloudinary
 *   onRemove(index)            — called when a pre-uploaded file is removed
 *   uploadedFiles              — array of already-uploaded file data objects (from parent state)
 *   existingFiles              — server-saved attachment objects (for edit pages)
 *   disabled                   — disables the upload area when true
 */
const FileUpload = ({ onUploadStart, onUploadComplete, onRemove, uploadedFiles = [], existingFiles = [], disabled = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!isValidFileType(selectedFile.type, ALLOWED_FILE_TYPES)) {
      toast.error('Invalid file type. Only PDF, JPG, PNG are allowed.');
      return;
    }

    if (!isValidFileSize(selectedFile.size, MAX_FILE_SIZE)) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    if (onUploadStart) onUploadStart();
    const uploadToast = toast.loading(`Uploading "${selectedFile.name}"...`);

    try {
      const { data, error } = await uploadFileTemp(selectedFile);

      if (error || !data) {
        toast.dismiss(uploadToast);
        toast.error(`Upload failed: ${error || 'Unknown error'}`);
        if (onUploadComplete) onUploadComplete(null);
        return;
      }

      toast.dismiss(uploadToast);
      toast.success(`"${selectedFile.name}" uploaded!`);
      if (onUploadComplete) onUploadComplete(data);
    } catch (err) {
      toast.dismiss(uploadToast);
      toast.error('Upload failed. Please try again.');
      if (onUploadComplete) onUploadComplete(null);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType = '') => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase())) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-red-600" />;
  };

  const allFiles = [...(existingFiles || []), ...(uploadedFiles || [])];

  return (
    <div className="mb-4">
      {/* Upload Drop Zone */}
      <div className="mb-4">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={uploading || disabled}
        />
        <label htmlFor={uploading || disabled ? undefined : 'file-upload'}>
          <div className={`
            border-2 border-dashed rounded-xl p-6 text-center transition-all
            ${uploading || disabled
              ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              : 'bg-blue-50/30 border-blue-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'}
          `}>
            <div className="flex flex-col items-center">
              <div className={`p-3 rounded-full mb-3 ${uploading ? 'bg-gray-100' : 'bg-blue-100'}`}>
                {uploading
                  ? <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                  : <Upload className="w-6 h-6 text-blue-600" />}
              </div>
              <p className="text-sm font-bold text-gray-900">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* File List */}
      {allFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allFiles.map((file, index) => {
            const isExisting = !!file.id; // server-saved file has an `id`
            const fileName = file.file_name || file.name || 'File';
            const fileType = file.file_type || file.type || '';
            const fileSize = file.file_size || file.size || 0;
            const fileUrl = file.file_url || file.thumbnail_url || null;

            return (
              <div
                key={isExisting ? file.id : `up-${index}`}
                className={`flex items-center justify-between p-3 rounded-xl border shadow-sm ${
                  isExisting
                    ? 'bg-white border-gray-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail or icon */}
                  {fileUrl && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase()) ? (
                    <img
                      src={fileUrl}
                      alt={fileName}
                      className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                    />
                  ) : (
                    <div className="flex-shrink-0">{getFileIcon(fileType)}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{fileName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {!isExisting && (
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      )}
                      <p className={`text-[10px] font-bold uppercase ${isExisting ? 'text-gray-400' : 'text-green-600'}`}>
                        {(fileSize / 1024).toFixed(1)} KB • {isExisting ? 'SAVED' : 'UPLOADED ✓'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove && onRemove(index, isExisting ? file.id : null)}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;