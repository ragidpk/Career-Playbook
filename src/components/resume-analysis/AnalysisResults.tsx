import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Briefcase,
  Code,
  GraduationCap,
  Lightbulb,
  Target,
} from 'lucide-react';
import Card from '../shared/Card';
import type { AnalysisResult, JobDescription } from '../../types/jdAnalysis.types';

interface AnalysisResultsProps {
  result: AnalysisResult;
  jobDescription: JobDescription;
}

export default function AnalysisResults({ result, jobDescription }: AnalysisResultsProps) {
  const [expandedImprovement, setExpandedImprovement] = useState<number | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreRing = (score: number) => {
    if (score >= 80) return 'ring-green-500';
    if (score >= 60) return 'ring-yellow-500';
    return 'ring-red-500';
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(result.tailoredSummary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleImprovement = (index: number) => {
    setExpandedImprovement(expandedImprovement === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Header with Job Info */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{jobDescription.title}</h2>
            <p className="text-gray-600 mt-1">{jobDescription.company}</p>
            {jobDescription.location && (
              <p className="text-sm text-gray-500">{jobDescription.location}</p>
            )}
          </div>
          <div className={`flex flex-col items-center p-4 rounded-2xl ${getScoreBg(result.matchScore)}`}>
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ring-4 ${getScoreRing(result.matchScore)} bg-white`}
            >
              <span className={`text-2xl font-bold ${getScoreColor(result.matchScore)}`}>
                {result.matchScore}%
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 mt-2">Match Score</span>
          </div>
        </div>
      </Card>

      {/* Keyword Analysis */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Matched Keywords */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Matched ({result.keywordAnalysis.matched.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.keywordAnalysis.matched.map((keyword, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {result.keywordAnalysis.matched.length === 0 && (
                <span className="text-sm text-green-600">No matching keywords found</span>
              )}
            </div>
          </div>

          {/* Missing Keywords */}
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Missing ({result.keywordAnalysis.missing.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.keywordAnalysis.missing.map((keyword, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {result.keywordAnalysis.missing.length === 0 && (
                <span className="text-sm text-red-600">No missing keywords!</span>
              )}
            </div>
          </div>

          {/* Bonus Keywords */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Bonus ({result.keywordAnalysis.bonus.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.keywordAnalysis.bonus.map((keyword, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                >
                  {keyword}
                </span>
              ))}
              {result.keywordAnalysis.bonus.length === 0 && (
                <span className="text-sm text-blue-600">No bonus skills identified</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Section Analysis */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Experience */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">Experience</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    result.sectionAnalysis.experience.score >= 80
                      ? 'bg-green-500'
                      : result.sectionAnalysis.experience.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${result.sectionAnalysis.experience.score}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(result.sectionAnalysis.experience.score)}`}>
                {result.sectionAnalysis.experience.score}%
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.sectionAnalysis.experience.feedback}</p>
          </div>

          {/* Skills */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">Skills</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    result.sectionAnalysis.skills.score >= 80
                      ? 'bg-green-500'
                      : result.sectionAnalysis.skills.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${result.sectionAnalysis.skills.score}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(result.sectionAnalysis.skills.score)}`}>
                {result.sectionAnalysis.skills.score}%
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.sectionAnalysis.skills.feedback}</p>
          </div>

          {/* Education */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">Education</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    result.sectionAnalysis.education.score >= 80
                      ? 'bg-green-500'
                      : result.sectionAnalysis.education.score >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${result.sectionAnalysis.education.score}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getScoreColor(result.sectionAnalysis.education.score)}`}>
                {result.sectionAnalysis.education.score}%
              </span>
            </div>
            <p className="text-sm text-gray-600">{result.sectionAnalysis.education.feedback}</p>
          </div>
        </div>
      </Card>

      {/* Tailored Summary */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Tailored Summary</h3>
          </div>
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {copiedSummary ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <p className="text-gray-700 leading-relaxed">{result.tailoredSummary}</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Use this AI-generated summary in your resume for this specific job application.
        </p>
      </Card>

      {/* Improvement Suggestions */}
      {result.improvements.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Improvement Suggestions</h3>
          </div>
          <div className="space-y-3">
            {result.improvements.map((improvement, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleImprovement(index)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{improvement.section}</span>
                  </div>
                  {expandedImprovement === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedImprovement === index && (
                  <div className="px-4 pb-4 space-y-3 bg-gray-50">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Current</p>
                      <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                        {improvement.current || 'Not specified in resume'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Suggested</p>
                      <p className="text-sm text-gray-900 bg-green-50 p-2 rounded border border-green-200">
                        {improvement.suggested}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Why</p>
                      <p className="text-sm text-gray-600">{improvement.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Items */}
      {result.actionItems.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Action Items</h3>
          <div className="space-y-2">
            {result.actionItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                    index === 0
                      ? 'bg-red-500'
                      : index === 1
                      ? 'bg-orange-500'
                      : index === 2
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`}
                >
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
