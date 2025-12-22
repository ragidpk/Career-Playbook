import { useState, useCallback } from 'react';
import { Link2, Upload, FileText, AlertCircle, Check } from 'lucide-react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import type { JobDescription, JDSourceType } from '../../types/jdAnalysis.types';

interface JDInputProps {
  onExtract?: (jd: JobDescription) => void;
  onExtractRequest: (source: JDSourceType, data: { url?: string; file?: File; text?: string }) => void;
  isExtracting: boolean;
  extractedJD: JobDescription | null;
  error: string | null;
}

type TabType = 'url' | 'file' | 'text';

export default function JDInput({
  onExtractRequest,
  isExtracting,
  extractedJD,
  error,
}: JDInputProps) {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'From URL', icon: <Link2 className="h-4 w-4" /> },
    { id: 'file', label: 'Upload File', icon: <Upload className="h-4 w-4" /> },
    { id: 'text', label: 'Paste Text', icon: <FileText className="h-4 w-4" /> },
  ];

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    setLocalError(null);
    if (!url.trim()) {
      setLocalError('Please enter a URL');
      return;
    }
    if (!validateUrl(url)) {
      setLocalError('Please enter a valid URL');
      return;
    }
    onExtractRequest('url', { url: url.trim() });
  };

  const validateFile = (file: File): boolean => {
    setLocalError(null);
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExtensions = ['.pdf', '.docx', '.txt'];

    const hasValidExtension = allowedExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      setLocalError('Only PDF, DOCX, or TXT files are allowed');
      return false;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setLocalError('File size must be less than 5MB');
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

  const handleFileSubmit = () => {
    if (!selectedFile) {
      setLocalError('Please select a file');
      return;
    }
    onExtractRequest('file', { file: selectedFile });
  };

  const handleTextSubmit = () => {
    setLocalError(null);
    if (!pastedText.trim()) {
      setLocalError('Please paste the job description');
      return;
    }
    if (pastedText.trim().length < 100) {
      setLocalError('Job description is too short (minimum 100 characters)');
      return;
    }
    onExtractRequest('text', { text: pastedText.trim() });
  };

  const displayError = localError || error;

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
          <p className="text-sm text-gray-500 mt-1">
            Provide the job description to compare against your resume
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setLocalError(null);
              }}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isExtracting}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supports LinkedIn, Indeed, and most job posting websites
                </p>
              </div>
              <Button
                onClick={handleUrlSubmit}
                disabled={isExtracting || !url.trim()}
                loading={isExtracting}
                className="w-full"
              >
                Extract Job Details
              </Button>
            </div>
          )}

          {/* File Tab */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
                  ${isExtracting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
                `}
              >
                <input
                  type="file"
                  id="jd-file-upload"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isExtracting}
                />
                <label htmlFor="jd-file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {selectedFile ? (
                      <>
                        <FileText className="h-10 w-10 text-primary-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Drag and drop or click to upload
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOCX, or TXT (max 5MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
              <Button
                onClick={handleFileSubmit}
                disabled={isExtracting || !selectedFile}
                loading={isExtracting}
                className="w-full"
              >
                Extract Job Details
              </Button>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Job Description
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={8}
                  disabled={isExtracting}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{pastedText.length} characters</span>
                  <span>Minimum 100 characters</span>
                </div>
              </div>
              <Button
                onClick={handleTextSubmit}
                disabled={isExtracting || pastedText.length < 100}
                loading={isExtracting}
                className="w-full"
              >
                Process Job Description
              </Button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{displayError}</p>
          </div>
        )}

        {/* Extracted JD Preview */}
        {extractedJD && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">Job Description Extracted</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Title:</span> {extractedJD.title}
                  </p>
                  <p className="text-sm text-green-700">
                    <span className="font-medium">Company:</span> {extractedJD.company}
                  </p>
                  {extractedJD.location && (
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Location:</span> {extractedJD.location}
                    </p>
                  )}
                  {extractedJD.skills && extractedJD.skills.length > 0 && (
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Skills:</span> {extractedJD.skills.slice(0, 5).join(', ')}
                      {extractedJD.skills.length > 5 && ` +${extractedJD.skills.length - 5} more`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
