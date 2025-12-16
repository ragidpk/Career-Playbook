import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import Avatar from './Avatar';
import { uploadAvatar, AvatarUploadError } from '../../services/avatar.service';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName?: string | null;
  onUploadComplete: (newUrl: string) => void;
  size?: 'md' | 'lg' | 'xl';
}

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  userName,
  onUploadComplete,
  size = 'lg',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Please select a JPEG, PNG, WebP, or GIF image');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload
    setIsUploading(true);
    try {
      const newUrl = await uploadAvatar(userId, file);
      onUploadComplete(newUrl);
      setPreviewUrl(null);
    } catch (err) {
      if (err instanceof AvatarUploadError) {
        setError(err.message);
      } else {
        setError('Failed to upload photo. Please try again.');
      }
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    // Cleanup preview URL
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="relative rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          <Avatar src={displayUrl} name={userName} size={size} />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload text */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400"
      >
        {isUploading ? 'Uploading...' : 'Change photo'}
      </button>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error-600 bg-error-50 px-3 py-2 rounded-lg">
          <X className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
