import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { checkUsageLimit } from '../../services/resume.service';
import Button from '../shared/Button';
import Card from '../shared/Card';

interface ResumeUploadProps {
  onUpload: (file: File) => void;
  userId: string;
  isUploading?: boolean;
}

export default function ResumeUpload({ onUpload, userId, isUploading = false }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check usage limit on component mount
  useEffect(() => {
    loadUsageInfo();
  }, [userId]);

  const loadUsageInfo = async () => {
    try {
      const info = await checkUsageLimit(userId);
      setUsageInfo(info);
    } catch (error) {
      console.error('Error checking usage limit:', error);
      setError('Unable to check usage limit');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return false;
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = () => {
    if (selectedFile && usageInfo && usageInfo.remaining > 0) {
      onUpload(selectedFile);
    }
  };

  const getNextResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </Card>
    );
  }

  const quotaExceeded = usageInfo && usageInfo.remaining === 0;

  return (
    <Card>
      <div className="p-6">
        {/* Usage Quota Display */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Resume Analysis</h3>
            <div className={`text-sm font-medium ${quotaExceeded ? 'text-red-600' : 'text-green-600'}`}>
              {usageInfo && (
                <>
                  {usageInfo.remaining} / {usageInfo.limit} analyses remaining this month
                </>
              )}
            </div>
          </div>
          {quotaExceeded && (
            <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Monthly limit reached</p>
                <p className="mt-1">
                  You have used all {usageInfo.limit} analyses for this month. Your quota will reset on {getNextResetDate()}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
            ${quotaExceeded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
          `}
        >
          <input
            type="file"
            id="resume-upload"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={quotaExceeded || isUploading}
          />

          <label
            htmlFor="resume-upload"
            className={`cursor-pointer ${quotaExceeded ? 'cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center gap-4">
              {selectedFile ? (
                <>
                  <FileText className="h-12 w-12 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {quotaExceeded ? 'Upload disabled - quota exceeded' : 'Drag and drop your resume here'}
                    </p>
                    {!quotaExceeded && (
                      <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                    )}
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500">PDF only, max 10MB</p>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !quotaExceeded && (
          <div className="mt-6">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
