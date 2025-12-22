// Job Recommendations Component
// Displays AI-generated job title recommendations and search keywords
// Automatically loads saved recommendations on mount

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  Compass,
  Tag,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  Briefcase,
  Clock,
} from 'lucide-react';
import Button from '../shared/Button';
import {
  useSavedJobRecommendations,
  useGenerateJobRecommendations,
  useCareerProfile,
} from '../../hooks/useJobRecommendations';

interface JobRecommendationsProps {
  onSearchKeyword?: (keyword: string) => void;
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function JobRecommendations({ onSearchKeyword }: JobRecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [locations, setLocations] = useState<string>('UAE, Dubai');
  const [workType, setWorkType] = useState<string>('');
  const [seniority, setSeniority] = useState<string>('');

  const { data: careerProfile, isLoading: profileLoading } = useCareerProfile();
  const { data: savedData, isLoading: savedLoading } = useSavedJobRecommendations();
  const generateMutation = useGenerateJobRecommendations();

  // Get recommendations from saved data or mutation result
  const recommendations = savedData?.recommendations || null;
  const savedAt = savedData?.savedAt;

  // Auto-expand if we have saved recommendations
  useEffect(() => {
    if (recommendations && !isExpanded) {
      setIsExpanded(true);
    }
  }, [recommendations]);

  const handleGenerate = async () => {
    if (!careerProfile?.targetRole) return;

    try {
      await generateMutation.mutateAsync({
        targetRole: careerProfile.targetRole,
        currentRole: careerProfile.currentRole,
        skills: careerProfile.skills,
        industry: careerProfile.industry,
        locations: locations.split(',').map((l) => l.trim()).filter(Boolean),
        workType: workType || undefined,
        seniority: seniority || undefined,
      });
      setIsExpanded(true);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKeyword(text);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const handleKeywordClick = (keyword: string) => {
    if (onSearchKeyword) {
      onSearchKeyword(keyword);
    }
  };

  if (profileLoading || savedLoading) {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 border border-primary-100 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="h-5 bg-primary-100 rounded w-48 mb-2" />
            <div className="h-4 bg-primary-100 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!careerProfile?.targetRole) {
    return (
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 border border-primary-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">AI Job Recommendations</h3>
            <p className="text-sm text-gray-600 mt-1">
              Complete your Career Canvas with a target role to get personalized job title
              recommendations and search keywords.
            </p>
            <a
              href="/canvas"
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Briefcase className="h-4 w-4" />
              Go to Career Canvas
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 cursor-pointer"
        onClick={() => recommendations && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI Job Recommendations</h3>
              <p className="text-sm text-gray-600">
                Target: <span className="font-medium text-primary-700">{careerProfile.targetRole}</span>
                {savedAt && (
                  <span className="ml-2 text-gray-400">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {formatRelativeTime(savedAt)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!recommendations ? (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerate();
                }}
                loading={generateMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Generate
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerate();
                  }}
                  loading={generateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Input options (always visible when no recommendations) */}
        {!recommendations && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Locations</label>
              <input
                type="text"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                placeholder="UAE, Dubai, Remote"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seniority</label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Any</option>
                <option value="IC">Individual Contributor</option>
                <option value="Lead">Lead / Senior</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
                <option value="VP">VP / Executive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {recommendations && isExpanded && (
        <div className="p-4 space-y-6">
          {/* Positioning Summary */}
          {recommendations.positioningSummary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary-600" />
                <h4 className="font-medium text-gray-900">Your Positioning</h4>
              </div>
              <p className="text-sm text-gray-700">{recommendations.positioningSummary}</p>
            </div>
          )}

          {/* Best Match Titles */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Best Match Job Titles</h4>
              <span className="text-xs text-gray-500">({recommendations.bestMatchTitles.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.bestMatchTitles.map((title, i) => (
                <button
                  key={i}
                  onClick={() => handleKeywordClick(title)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Search className="h-3 w-3" />
                  {title}
                </button>
              ))}
            </div>
          </div>

          {/* Adjacent Titles */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Adjacent Roles to Consider</h4>
              <span className="text-xs text-gray-500">({recommendations.adjacentTitles.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.adjacentTitles.map((title, i) => (
                <button
                  key={i}
                  onClick={() => handleKeywordClick(title)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Search className="h-3 w-3" />
                  {title}
                </button>
              ))}
            </div>
          </div>

          {/* Title Variations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">Title Variations Recruiters Use</h4>
              <span className="text-xs text-gray-500">({recommendations.titleVariations.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendations.titleVariations.map((title, i) => (
                <button
                  key={i}
                  onClick={() => handleKeywordClick(title)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Search className="h-3 w-3" />
                  {title}
                </button>
              ))}
            </div>
          </div>

          {/* Keyword Pack */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-orange-600" />
                <h4 className="font-medium text-gray-900">Search Keywords</h4>
                <span className="text-xs text-gray-500">({recommendations.keywordPack.length})</span>
              </div>
              <button
                onClick={() => copyToClipboard(recommendations.keywordPack.join(', '))}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                {copiedKeyword === recommendations.keywordPack.join(', ') ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy All
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recommendations.keywordPack.map((keyword, i) => (
                <button
                  key={i}
                  onClick={() => handleKeywordClick(keyword)}
                  className="px-2 py-1 text-xs font-medium bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {generateMutation.isError && (
        <div className="p-4 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-600">
            Failed to generate recommendations. Please try again.
          </p>
        </div>
      )}
    </div>
  );
}
