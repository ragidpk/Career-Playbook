import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Check, ChevronDown, AlertCircle } from 'lucide-react';
import { getAnalysisHistory } from '../../services/resume.service';
import Button from '../shared/Button';
import Card from '../shared/Card';

interface ResumeAnalysis {
  id: string;
  file_name: string;
  file_url: string;
  extracted_text?: string;
  analysis_date: string;
}

interface ResumeSelectorProps {
  userId: string;
  onResumeSelect: (resumeText: string, fileName: string) => void;
  selectedResumeName: string | null;
  isLoading?: boolean;
}

export default function ResumeSelector({
  userId,
  onResumeSelect,
  selectedResumeName,
  isLoading = false,
}: ResumeSelectorProps) {
  const [mode, setMode] = useState<'existing' | 'upload'>('existing');
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [extractingText, setExtractingText] = useState(false);

  // Load existing resume analyses
  useEffect(() => {
    loadAnalyses();
  }, [userId]);

  const loadAnalyses = async () => {
    try {
      const data = await getAnalysisHistory(userId);
      // Filter to only those with extracted text
      const withText = data.filter((a: ResumeAnalysis) => a.extracted_text && a.extracted_text.length > 100);
      setAnalyses(withText);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleSelectExisting = (analysis: ResumeAnalysis) => {
    if (analysis.extracted_text) {
      onResumeSelect(analysis.extracted_text, analysis.file_name);
      setShowDropdown(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return false;
    }

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

  // Simple PDF text extraction for uploaded files
  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Convert file to base64 and call the Vercel API to extract text
    // For simplicity, we'll read the file and extract readable text
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Basic text extraction from PDF binary (works for text-based PDFs)
        // This is a simplified approach - real PDF parsing would need pdf.js
        const textMatches = content.match(/\(([^)]+)\)/g) || [];
        const extractedParts = textMatches
          .map(m => m.slice(1, -1))
          .filter(t => t.length > 1 && !/^[\d\s.]+$/.test(t));
        resolve(extractedParts.join(' '));
      };
      reader.readAsBinaryString(file);
    });
    return text;
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) return;

    setExtractingText(true);
    setError(null);

    try {
      // Simple client-side text extraction
      const text = await extractTextFromPDF(selectedFile);

      if (text.length < 100) {
        // If basic extraction fails, show error with guidance
        setError(
          'Could not extract text from this PDF. Please first analyze this resume in the Resume Analyzer, then select it from the dropdown.'
        );
        return;
      }

      onResumeSelect(text, selectedFile.name);
    } catch (err) {
      setError('Failed to extract text from PDF. Please use a previously analyzed resume.');
    } finally {
      setExtractingText(false);
    }
  };

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Resume</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select from your analyzed resumes or upload a new one
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('existing')}
            className={`
              flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors
              ${mode === 'existing'
                ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
              }
            `}
          >
            Select Existing
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`
              flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors
              ${mode === 'upload'
                ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
              }
            `}
          >
            Upload New
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[200px]">
          {mode === 'existing' ? (
            <div className="space-y-4">
              {loadingAnalyses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No analyzed resumes found. Upload and analyze a resume first.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => setMode('upload')}
                  >
                    Upload Resume
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 transition-colors"
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className={selectedResumeName ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedResumeName || 'Select a resume...'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {analyses.map((analysis) => (
                        <button
                          key={analysis.id}
                          onClick={() => handleSelectExisting(analysis)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        >
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {analysis.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Analyzed {new Date(analysis.analysis_date).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedResumeName === analysis.file_name && (
                            <Check className="h-4 w-4 text-primary-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
                  ${extractingText ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
                `}
              >
                <input
                  type="file"
                  id="resume-file-upload"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={extractingText}
                />
                <label htmlFor="resume-file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {selectedFile ? (
                      <>
                        <FileText className="h-10 w-10 text-primary-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                          <p className="text-xs text-gray-500 mt-1">PDF only, max 10MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <strong>Tip:</strong> For best results, first analyze your resume using the Resume
                  Analyzer feature, then select it from the dropdown above.
                </p>
              </div>

              {selectedFile && (
                <Button
                  onClick={handleUploadAndExtract}
                  disabled={extractingText || isLoading}
                  loading={extractingText}
                  className="w-full"
                >
                  Use This Resume
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Selected Resume Indicator */}
        {selectedResumeName && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Resume selected: {selectedResumeName}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
