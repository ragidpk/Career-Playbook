import { useState } from 'react';
import { Sparkles, Check, Edit2 } from 'lucide-react';

interface WizardQuestionProps {
  questionNumber: number;
  questionTitle: string;
  questionDescription: string;
  currentValue: string;
  currentRole: string;
  targetRole: string;
  onChange: (value: string) => void;
  onGetAISuggestion: () => Promise<string>;
}

// Truncate text to max length with ellipsis
const truncateText = (text: string, maxLength: number = 30) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Count words in text
const countWords = (text: string) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export default function WizardQuestion({
  questionNumber,
  questionTitle,
  questionDescription,
  currentValue,
  currentRole,
  targetRole,
  onChange,
  onGetAISuggestion,
}: WizardQuestionProps) {
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGetSuggestion = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const suggestion = await onGetAISuggestion();
      setAiSuggestion(suggestion);
      setShowSuggestion(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to get suggestion');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      onChange(aiSuggestion);
      setShowSuggestion(false);
      setAiSuggestion(null);
    }
  };

  const handleEditManually = () => {
    setShowSuggestion(false);
  };

  const wordCount = countWords(currentValue);

  return (
    <div className="space-y-4">
      {/* Question Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 text-primary-600 rounded-full text-xl font-bold mb-4">
          {questionNumber}
        </span>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
          {questionTitle}
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          {questionDescription}
        </p>
      </div>

      {/* Context Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="px-3 py-1 bg-gray-100 rounded-full" title={currentRole}>
          {truncateText(currentRole, 30)}
        </span>
        <span>→</span>
        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full" title={targetRole}>
          {truncateText(targetRole, 30)}
        </span>
      </div>

      {/* AI Suggestion Card */}
      {showSuggestion && aiSuggestion && (
        <div className="bg-gradient-to-br from-purple-50 to-primary-50 border border-purple-200 rounded-xl p-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">AI Suggestion</span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap mb-4">
            {aiSuggestion}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAcceptSuggestion}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept Suggestion
            </button>
            <button
              onClick={handleEditManually}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Manually
            </button>
          </div>
        </div>
      )}

      {/* Textarea */}
      {!showSuggestion && (
        <>
          <textarea
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
          />

          {/* Word Counter */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>

            {/* AI Suggestion Button */}
            <button
              onClick={handleGetSuggestion}
              disabled={isLoadingAI}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-primary-700 transition-colors disabled:opacity-50"
            >
              {isLoadingAI ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get AI Suggestion
                </>
              )}
            </button>
          </div>

          {/* AI Error */}
          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {aiError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
