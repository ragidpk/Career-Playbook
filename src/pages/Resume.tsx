import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadResume, analyzeResume, getAnalysisHistory, checkUsageLimit, deleteAnalysis } from '../services/resume.service';
import ResumeUpload from '../components/resume/ResumeUpload';
import AnalysisResults from '../components/resume/AnalysisResults';
import AnalysisHistory from '../components/resume/AnalysisHistory';
import LoadingSpinner from '../components/shared/LoadingSpinner';

interface NinetyDayStrategy {
  overview: string;
  weeks_1_4: string[];
  weeks_5_8: string[];
  weeks_9_12: string[];
}

interface Analysis {
  id: string;
  file_name: string;
  file_url: string;
  ats_score: number;
  analysis_date: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  target_country?: string;
  summary?: string;
  experience_level?: string;
  skills_identified?: string[];
  role_recommendations?: string[];
  job_search_approach?: string[];
  ninety_day_strategy?: NinetyDayStrategy;
}

const TARGET_COUNTRIES = [
  'United Arab Emirates',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Oman',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'India',
  'Other',
];

export default function Resume() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState(2);
  const [targetCountry, setTargetCountry] = useState('United Arab Emirates');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleUpload = async (file: File) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setToast({ message: 'Uploading and analyzing your resume...', type: 'success' });

      // Upload resume to storage (returns storage path, not URL)
      const filePath = await uploadResume(file, user.id);

      // Analyze resume with Edge Function (including target country)
      const result = await analyzeResume(filePath, file.name, targetCountry);

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
    } catch (error) {
      console.error('Error uploading/analyzing resume:', error);

      // Handle specific error messages
      let errorMessage = 'Failed to analyze resume. Please try again.';
      const errMsg = error instanceof Error ? error.message : '';
      if (errMsg.includes('Rate limit')) {
        errorMessage = 'You have exceeded your monthly analysis limit.';
      } else if (errMsg.includes('PDF')) {
        errorMessage = errMsg;
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

  const handleDeleteAnalysis = async (analysisId: string, filePath: string) => {
    if (!user) return;

    try {
      await deleteAnalysis(analysisId, filePath);

      // Remove from local state
      setHistory(prev => prev.filter(a => a.id !== analysisId));

      // Clear current analysis if it was deleted
      if (currentAnalysis?.id === analysisId) {
        const remaining = history.filter(a => a.id !== analysisId);
        setCurrentAnalysis(remaining.length > 0 ? remaining[0] : null);
      }

      setToast({
        message: 'Analysis deleted successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      setToast({
        message: 'Failed to delete analysis. Please try again.',
        type: 'error',
      });
    }
  };

  // Get user's full name
  const userFullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

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
            {/* Target Country Selector */}
            {(!currentAnalysis || history.length < 2) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <label htmlFor="targetCountry" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Job Market
                </label>
                <select
                  id="targetCountry"
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  disabled={isUploading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:bg-gray-100"
                >
                  {TARGET_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Select your target country for job-market specific recommendations
                </p>
              </div>
            )}

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
                userName={userFullName}
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
            <AnalysisHistory
              analyses={history}
              onSelectAnalysis={handleSelectAnalysis}
              onDeleteAnalysis={handleDeleteAnalysis}
            />
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
