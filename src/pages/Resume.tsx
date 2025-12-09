import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadResume, analyzeResume, getAnalysisHistory, checkUsageLimit } from '../services/resume.service';
import ResumeUpload from '../components/resume/ResumeUpload';
import AnalysisResults from '../components/resume/AnalysisResults';
import AnalysisHistory from '../components/resume/AnalysisHistory';
import LoadingSpinner from '../components/shared/LoadingSpinner';
// Toast component will be used for notifications

interface Analysis {
  id: string;
  file_name: string;
  ats_score: number;
  analysis_date: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export default function Resume() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState(2);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [historyData, usageData] = await Promise.all([
        getAnalysisHistory(user.id),
        checkUsageLimit(user.id),
      ]);

      setHistory(historyData as Analysis[]);
      setRemainingAnalyses(usageData.remaining);

      // Set the most recent analysis as current if available
      if (historyData && historyData.length > 0) {
        setCurrentAnalysis(historyData[0] as Analysis);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({
        message: 'Failed to load resume analysis data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setToast({ message: 'Uploading and analyzing your resume...', type: 'success' });

      // Upload resume to storage (returns storage path, not URL)
      const filePath = await uploadResume(file, user.id);

      // Analyze resume with Edge Function
      const result = await analyzeResume(filePath, file.name);

      if (result.success && result.analysis) {
        setCurrentAnalysis(result.analysis);
        setRemainingAnalyses(result.remainingAnalyses ?? remainingAnalyses - 1);

        // Refresh history
        const updatedHistory = await getAnalysisHistory(user.id);
        setHistory(updatedHistory as Analysis[]);

        setToast({
          message: 'Resume analysis completed successfully!',
          type: 'success',
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error: any) {
      console.error('Error uploading/analyzing resume:', error);

      // Handle specific error messages
      let errorMessage = 'Failed to analyze resume. Please try again.';
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'You have exceeded your monthly analysis limit.';
      } else if (error.message?.includes('PDF')) {
        errorMessage = error.message;
      }

      setToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAnalysis = (analysis: Analysis) => {
    setCurrentAnalysis(analysis);
    // Scroll to top to show the analysis results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to access resume analysis.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis</h1>
          <p className="text-gray-600">
            Upload your resume for AI-powered ATS scoring and recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload & Results */}
          <div className="lg:col-span-2 space-y-8">
            {/* Show upload zone if no current analysis or always visible */}
            {(!currentAnalysis || history.length < 2) && (
              <ResumeUpload
                onUpload={handleUpload}
                userId={user.id}
                isUploading={isUploading}
              />
            )}

            {/* Show analysis results if available */}
            {currentAnalysis && (
              <AnalysisResults
                analysis={currentAnalysis}
                remainingAnalyses={remainingAnalyses}
              />
            )}

            {/* Empty state if no analysis */}
            {!currentAnalysis && !isUploading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Resume Analyzed Yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload your resume above to get started with AI-powered analysis and recommendations.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-1">
            <AnalysisHistory analyses={history} onSelectAnalysis={handleSelectAnalysis} />
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 font-bold">×</button>
          </div>
        </div>
      )}
    </div>
  );
}
