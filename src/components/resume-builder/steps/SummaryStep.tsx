import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useAIImprovement } from '../../../hooks/useResumeBuilder';

interface SummaryStepProps {
  summary: string;
  onUpdate: (summary: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function SummaryStep({ summary, onUpdate, onNext, onPrev }: SummaryStepProps) {
  const [value, setValue] = useState(summary);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { improve, isImproving, error: aiError, clearError } = useAIImprovement();

  // Debounced save function
  const debouncedSave = useCallback((newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (newValue !== summary) {
        onUpdate(newValue);
      }
    }, 1000);
  }, [onUpdate, summary]);

  // Auto-save on changes
  useEffect(() => {
    debouncedSave(value);
  }, [value, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleImprove = async () => {
    if (!value.trim()) return;
    clearError();

    try {
      const result = await improve({
        type: 'summary',
        content: value,
      });
      setValue(result.improved);
      onUpdate(result.improved);
    } catch {
      // Error is handled in the hook
    }
  };

  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const isOptimalLength = wordCount >= 30 && wordCount <= 80;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Professional Summary</h2>
        <p className="text-sm text-gray-600 mt-1">
          Write a compelling 2-3 sentence summary highlighting your expertise and value
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Summary
            </label>
            <span className={`text-xs ${isOptimalLength ? 'text-green-600' : 'text-gray-500'}`}>
              {wordCount} words {isOptimalLength ? '(optimal)' : '(aim for 30-80 words)'}
            </span>
          </div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            placeholder="Results-driven software engineer with 8+ years of experience building scalable web applications. Expert in React, Node.js, and cloud architecture. Passionate about delivering elegant solutions that drive business growth."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        {/* AI Improve Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleImprove}
            disabled={isImproving || !value.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isImproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isImproving ? 'Improving...' : 'Improve with AI'}
          </button>
          <span className="text-sm text-gray-500">
            Let AI enhance your summary for ATS optimization
          </span>
        </div>

        {aiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {aiError}
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for a Great Summary</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Start with your years of experience and specialty</li>
            <li>Highlight 2-3 key skills or technologies</li>
            <li>Include a notable achievement with metrics if possible</li>
            <li>End with your career goal or what you bring to employers</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Next: Experience
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
