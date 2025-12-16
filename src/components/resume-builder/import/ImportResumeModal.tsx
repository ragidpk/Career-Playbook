import { useState, useCallback } from 'react';
import { X, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useUserResumes, useResumeImport } from '../../../hooks/useResumeBuilder';

interface ImportResumeModalProps {
  onClose: () => void;
  onImportComplete: (resumeId: string) => void;
}

export default function ImportResumeModal({ onClose, onImportComplete }: ImportResumeModalProps) {
  const { user } = useAuth();
  const { create } = useUserResumes(user?.id);
  const { importPdf, isImporting, error } = useResumeImport();

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<'upload' | 'processing' | 'complete'>('upload');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setStage('processing');

    try {
      // Parse the PDF to extract resume data
      const parsedData = await importPdf(file);

      // Create a new resume with the parsed data
      const newResume = await create({
        name: file.name.replace('.pdf', ''),
        imported_from: file.name,
        personal_info: parsedData.personal_info,
        professional_summary: parsedData.professional_summary || undefined,
        work_experience: parsedData.work_experience,
        education: parsedData.education,
        skills: parsedData.skills,
        certifications: parsedData.certifications,
        projects: parsedData.projects,
      });

      setStage('complete');
      onImportComplete(newResume.id);
    } catch {
      setStage('upload');
      // Error is handled by the hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Import Resume from PDF
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Upload an existing resume PDF and we'll extract the content for editing.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">
                  Please try a different PDF or create a resume from scratch.
                </p>
              </div>
            </div>
          )}

          {stage === 'upload' && (
            <>
              {/* Drop zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-12 w-12 text-green-600 mb-3" />
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setFile(null)}
                      className="mt-3 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="font-medium text-gray-900 mb-1">
                      Drop your resume here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        Select File
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-4">PDF files only, max 10MB</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || isImporting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Import Resume
                </button>
              </div>
            </>
          )}

          {stage === 'processing' && (
            <div className="py-12 text-center">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="font-medium text-gray-900 mb-2">Processing your resume...</p>
              <p className="text-sm text-gray-500">
                Extracting content using AI. This may take a moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
