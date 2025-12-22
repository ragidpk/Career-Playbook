import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useExtractJD, useAnalyzeResumeVsJD, useSaveJobDescription, useSaveAnalysisResult } from '../hooks/useJDAnalysis';
import JDInput from '../components/resume-analysis/JDInput';
import ResumeSelector from '../components/resume-analysis/ResumeSelector';
import AnalysisResults from '../components/resume-analysis/AnalysisResults';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import Button from '../components/shared/Button';
import type { JobDescription, JDSourceType, AnalysisResult } from '../types/jdAnalysis.types';

export default function ResumeJDAnalysis() {
  const { user } = useAuth();

  // State for inputs
  const [extractedJD, setExtractedJD] = useState<JobDescription | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // State for analysis
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Mutations
  const extractJD = useExtractJD();
  const analyzeResume = useAnalyzeResumeVsJD();
  const saveJD = useSaveJobDescription();
  const saveAnalysis = useSaveAnalysisResult();

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Handle JD extraction
  const handleExtractJD = useCallback(async (
    source: JDSourceType,
    data: { url?: string; file?: File; text?: string }
  ) => {
    setExtractError(null);

    try {
      let request: Parameters<typeof extractJD.mutateAsync>[0];

      if (source === 'url') {
        request = { source: 'url', url: data.url };
      } else if (source === 'file' && data.file) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(data.file!);
        });
        request = { source: 'file', fileBase64: base64, fileName: data.file.name };
      } else if (source === 'text') {
        request = { source: 'text', text: data.text };
      } else {
        throw new Error('Invalid source type');
      }

      const result = await extractJD.mutateAsync(request);
      setExtractedJD(result);
      showToast('Job description extracted successfully!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract job description';
      setExtractError(message);
      showToast(message, 'error');
    }
  }, [extractJD]);

  // Handle resume selection
  const handleResumeSelect = useCallback((text: string, fileName: string) => {
    setResumeText(text);
    setResumeFileName(fileName);
  }, []);

  // Run analysis
  const handleRunAnalysis = async () => {
    if (!user || !extractedJD || !resumeText) return;

    try {
      // Analyze resume against JD
      const result = await analyzeResume.mutateAsync({
        resumeText,
        jobDescription: extractedJD,
      });

      setAnalysisResult(result);

      // Save JD and analysis to database
      try {
        const savedJD = await saveJD.mutateAsync({
          userId: user.id,
          input: {
            title: extractedJD.title,
            company: extractedJD.company,
            location: extractedJD.location,
            description: extractedJD.description,
            requirements: extractedJD.requirements,
            skills: extractedJD.skills,
            experience_required: extractedJD.experience_required,
            source_url: extractedJD.source_url,
            source_type: extractedJD.source_type || 'text',
          },
        });

        await saveAnalysis.mutateAsync({
          userId: user.id,
          input: {
            job_description_id: savedJD.id!,
            resume_file_name: resumeFileName || undefined,
            resume_text: resumeText,
            match_score: result.matchScore,
            keyword_analysis: result.keywordAnalysis,
            section_analysis: result.sectionAnalysis,
            improvements: result.improvements,
            tailored_summary: result.tailoredSummary,
            action_items: result.actionItems,
          },
        });
      } catch (saveErr) {
        console.error('Failed to save analysis:', saveErr);
        // Don't block - analysis still succeeded
      }

      showToast('Analysis completed successfully!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze resume';
      showToast(message, 'error');
    }
  };

  // Reset for new analysis
  const handleNewAnalysis = () => {
    setExtractedJD(null);
    setResumeText(null);
    setResumeFileName(null);
    setAnalysisResult(null);
    setExtractError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to access resume analysis.</p>
      </div>
    );
  }

  const canAnalyze = extractedJD && resumeText && !analyzeResume.isPending;
  const isAnalyzing = analyzeResume.isPending;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume vs Job Description</h1>
          <p className="text-gray-600">
            Compare your resume against a specific job description to optimize your application
          </p>
        </div>

        {/* Show analysis results if available */}
        {analysisResult && extractedJD ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Analysis Results</h2>
              <Button variant="secondary" onClick={handleNewAnalysis}>
                New Analysis
              </Button>
            </div>
            <AnalysisResults result={analysisResult} jobDescription={extractedJD} />
          </div>
        ) : (
          <>
            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Resume Selector */}
              <ResumeSelector
                userId={user.id}
                onResumeSelect={handleResumeSelect}
                selectedResumeName={resumeFileName}
                isLoading={isAnalyzing}
              />

              {/* JD Input */}
              <JDInput
                onExtract={setExtractedJD}
                onExtractRequest={handleExtractJD}
                isExtracting={extractJD.isPending}
                extractedJD={extractedJD}
                error={extractError}
              />
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleRunAnalysis}
                disabled={!canAnalyze}
                loading={isAnalyzing}
                size="lg"
                className="min-w-[200px]"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Match'}
              </Button>
            </div>

            {/* Loading State */}
            {isAnalyzing && (
              <div className="mt-8 bg-white rounded-2xl shadow-card p-8 text-center">
                <LoadingSpinner />
                <p className="text-gray-600 mt-4">
                  Analyzing your resume against the job description...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take up to 30 seconds
                </p>
              </div>
            )}

            {/* Helper Text */}
            {!canAnalyze && !isAnalyzing && (
              <div className="mt-8 text-center">
                <p className="text-gray-500">
                  {!resumeText && !extractedJD
                    ? 'Select a resume and provide a job description to get started'
                    : !resumeText
                    ? 'Select a resume to continue'
                    : 'Extract or enter a job description to continue'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 font-bold">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
