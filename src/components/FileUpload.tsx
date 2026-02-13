/**
 * File Upload Component
 *
 * Reusable component for uploading photos/files.
 * Features:
 * - Multi-file selection (camera or gallery on mobile)
 * - Preview thumbnails
 * - Upload progress indicators
 * - Remove file functionality
 * - File validation (type, size)
 * - Mobile-optimized
 *
 * Usage:
 * <FileUpload
 *   workOrderId="88123"
 *   maxFiles={10}
 *   onUploadComplete={(urls) => console.log(urls)}
 *   onError={(error) => console.error(error)}
 * />
 */

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { uploadFile, UploadResult } from '@/lib/storage';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/jpg',
];

interface FileWithPreview {
  file: File;
  preview: string;
  uploadProgress: number;
  uploadedUrl?: string;
  error?: string;
}

interface FileUploadProps {
  workOrderId: string;
  maxFiles?: number;
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function FileUpload({
  workOrderId,
  maxFiles = 10,
  onUploadComplete,
  onError,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate a single file
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Only images are allowed.`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max size is 10MB.`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) return;

    // Check max files limit
    if (files.length + selectedFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and create previews
    const newFiles: FileWithPreview[] = [];

    for (const file of selectedFiles) {
      const error = validateFile(file);

      if (error) {
        onError?.(error);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);

      newFiles.push({
        file,
        preview,
        uploadProgress: 0,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Auto-upload
    uploadFiles(newFiles);
  };

  /**
   * Upload files to storage
   */
  const uploadFiles = async (filesToUpload: FileWithPreview[]) => {
    setIsUploading(true);

    const uploadPromises = filesToUpload.map(async (fileWithPreview) => {
      try {
        // Update progress (simulated - real progress would need storage API support)
        updateFileProgress(fileWithPreview.preview, 50);

        // Upload file
        const result: UploadResult = await uploadFile(
          fileWithPreview.file,
          workOrderId
        );

        // Update with uploaded URL
        updateFileProgress(fileWithPreview.preview, 100, result.url);

        return result.url;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Upload failed';
        updateFileError(fileWithPreview.preview, errorMessage);
        onError?.(errorMessage);
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const successfulUrls = uploadedUrls.filter((url) => url !== null) as string[];

    setIsUploading(false);

    // Notify parent of successful uploads
    if (successfulUrls.length > 0 && onUploadComplete) {
      const allUploadedUrls = files
        .filter((f) => f.uploadedUrl)
        .map((f) => f.uploadedUrl!);
      onUploadComplete([...allUploadedUrls, ...successfulUrls]);
    }
  };

  /**
   * Update file upload progress
   */
  const updateFileProgress = (
    preview: string,
    progress: number,
    uploadedUrl?: string
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.preview === preview
          ? { ...f, uploadProgress: progress, uploadedUrl, error: undefined }
          : f
      )
    );
  };

  /**
   * Update file with error
   */
  const updateFileError = (preview: string, error: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.preview === preview ? { ...f, error } : f))
    );
  };

  /**
   * Remove a file
   */
  const removeFile = (preview: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.preview !== preview);

      // Revoke preview URL to free memory
      URL.revokeObjectURL(preview);

      // Notify parent of updated URLs
      if (onUploadComplete) {
        const uploadedUrls = updated
          .filter((f) => f.uploadedUrl)
          .map((f) => f.uploadedUrl!);
        onUploadComplete(uploadedUrls);
      }

      return updated;
    });
  };

  /**
   * Trigger file input click
   */
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled || isUploading || files.length >= maxFiles}
        className={`w-full px-4 py-3 border-2 border-dashed rounded-lg transition ${
          disabled || isUploading || files.length >= maxFiles
            ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-medium">
            {isUploading ? 'Uploading...' : 'Take Photo or Choose from Gallery'}
          </span>
          <span className="text-xs">
            {files.length}/{maxFiles} files
          </span>
        </div>
      </button>

      {/* File previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {files.map((fileWithPreview) => (
            <div
              key={fileWithPreview.preview}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              {/* Image preview */}
              <img
                src={fileWithPreview.preview}
                alt={fileWithPreview.file.name}
                className="w-full h-full object-cover"
              />

              {/* Upload progress overlay */}
              {fileWithPreview.uploadProgress < 100 &&
                !fileWithPreview.error && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold">
                        {fileWithPreview.uploadProgress}%
                      </div>
                      <div className="text-xs">Uploading...</div>
                    </div>
                  </div>
                )}

              {/* Error overlay */}
              {fileWithPreview.error && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center p-2">
                  <div className="text-white text-xs text-center">
                    {fileWithPreview.error}
                  </div>
                </div>
              )}

              {/* Success checkmark */}
              {fileWithPreview.uploadedUrl && !fileWithPreview.error && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFile(fileWithPreview.preview)}
                disabled={isUploading}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* File name */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                {fileWithPreview.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File info */}
      {files.length > 0 && (
        <div className="text-xs text-gray-500">
          <p>Allowed: JPG, PNG, WebP, HEIC (max 10MB each)</p>
        </div>
      )}
    </div>
  );
}
