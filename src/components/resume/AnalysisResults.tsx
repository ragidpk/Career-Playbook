import { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Briefcase,
  Target,
  Calendar,
  User,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card from '../shared/Card';
import ATSScore from './ATSScore';

interface NinetyDayStrategy {
  overview: string;
  weeks_1_4: string[];
  weeks_5_8: string[];
  weeks_9_12: string[];
}

interface AnalysisResultsProps {
  analysis: {
    ats_score: number;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    candidate_name?: string;
    target_country?: string;
    summary?: string;
    experience_level?: string;
    skills_identified?: string[];
    role_recommendations?: string[];
    job_search_approach?: string[];
    ninety_day_strategy?: NinetyDayStrategy;
  };
  remainingAnalyses: number;
}

type SectionKey = 'strengths' | 'improvements' | 'recommendations' | 'roles' | 'strategy' | 'plan';

const EXPERIENCE_COLORS: Record<string, { bg: string; text: string }> = {
  'Entry-level': { bg: 'bg-green-100', text: 'text-green-800' },
  'Mid-level': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'Senior': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'Executive': { bg: 'bg-amber-100', text: 'text-amber-800' },
};

export default function AnalysisResults({ analysis, remainingAnalyses }: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['strengths', 'improvements', 'recommendations'])
  );

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const expColors = analysis.experience_level
    ? EXPERIENCE_COLORS[analysis.experience_level] || { bg: 'bg-gray-100', text: 'text-gray-800' }
    : { bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <div className="space-y-6">
      {/* Remaining Analyses Notice */}
      {remainingAnalyses !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            You have <span className="font-semibold">{remainingAnalyses}</span>{' '}
            {remainingAnalyses === 1 ? 'analysis' : 'analyses'} remaining this month.
          </p>
        </div>
      )}

      {/* Executive Summary Card */}
      <Card>
        <div className="p-6">
          {/* Candidate Name Header */}
          {analysis.candidate_name && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Resume Analysis for {analysis.candidate_name}</h2>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* ATS Score */}
            <div className="flex-shrink-0">
              <ATSScore score={analysis.ats_score} size="lg" />
            </div>

            {/* Summary Content */}
            <div className="flex-1 space-y-4">
              {/* Target Country Badge */}
              {analysis.target_country && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>Analysis for <strong>{analysis.target_country}</strong> job market</span>
                </div>
              )}

              {/* Experience Level Badge */}
              {analysis.experience_level && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${expColors.bg} ${expColors.text}`}>
                    {analysis.experience_level}
                  </span>
                </div>
              )}

              {/* Summary Text */}
              {analysis.summary ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Executive Summary</h3>
                  <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
                </div>
              ) : (
                <div className="text-center max-w-md">
                  <p className="text-sm text-gray-600">
                    {analysis.ats_score <= 30 &&
                      'Your resume needs significant improvements to pass through Applicant Tracking Systems.'}
                    {analysis.ats_score > 30 && analysis.ats_score <= 70 &&
                      'Your resume has a decent chance of passing through ATS, but there\'s room for improvement.'}
                    {analysis.ats_score > 70 &&
                      'Excellent! Your resume is well-optimized for ATS. Keep refining it to maintain this strong performance.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Skills Identified - Badge Style */}
      {analysis.skills_identified && analysis.skills_identified.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-500" />
              Skills Identified
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.skills_identified.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 rounded-full text-sm font-medium border border-primary-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Key Strengths */}
      <Card>
        <button
          onClick={() => toggleSection('strengths')}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Key Strengths ({analysis.strengths.length})
          </h3>
          {expandedSections.has('strengths') ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has('strengths') && (
          <div className="px-6 pb-6 space-y-3">
            {analysis.strengths.map((strength, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
              >
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{strength}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <button
          onClick={() => toggleSection('improvements')}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Areas for Improvement ({analysis.gaps.length})
          </h3>
          {expandedSections.has('improvements') ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has('improvements') && (
          <div className="px-6 pb-6 space-y-3">
            {analysis.gaps.map((gap, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
              >
                <span className="h-2 w-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
                <p className="text-sm text-gray-700">{gap}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full p-6 flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Recommendations ({analysis.recommendations.length})
          </h3>
          {expandedSections.has('recommendations') ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        {expandedSections.has('recommendations') && (
          <div className="px-6 pb-6 space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <span className="flex-shrink-0 h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Role Recommendations - Only show if enhanced data exists */}
      {analysis.role_recommendations && analysis.role_recommendations.length > 0 && (
        <Card>
          <button
            onClick={() => toggleSection('roles')}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-500" />
              Suitable Roles ({analysis.role_recommendations.length})
            </h3>
            {expandedSections.has('roles') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.has('roles') && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.role_recommendations.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                  >
                    <Briefcase className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Job Search Strategy */}
      {analysis.job_search_approach && analysis.job_search_approach.length > 0 && (
        <Card>
          <button
            onClick={() => toggleSection('strategy')}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              Job Search Strategy ({analysis.job_search_approach.length})
            </h3>
            {expandedSections.has('strategy') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.has('strategy') && (
            <div className="px-6 pb-6 space-y-3">
              {analysis.job_search_approach.map((approach, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100"
                >
                  <span className="flex-shrink-0 h-6 w-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700">{approach}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 90-Day Action Plan */}
      {analysis.ninety_day_strategy && (
        analysis.ninety_day_strategy.weeks_1_4?.length > 0 ||
        analysis.ninety_day_strategy.weeks_5_8?.length > 0 ||
        analysis.ninety_day_strategy.weeks_9_12?.length > 0
      ) && (
        <Card>
          <button
            onClick={() => toggleSection('plan')}
            className="w-full p-6 flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-500" />
              90-Day Action Plan
            </h3>
            {expandedSections.has('plan') ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedSections.has('plan') && (
            <div className="px-6 pb-6 space-y-6">
              {/* Overview */}
              {analysis.ninety_day_strategy.overview && (
                <p className="text-gray-600 italic">{analysis.ninety_day_strategy.overview}</p>
              )}

              {/* Phase Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Weeks 1-4 */}
                {analysis.ninety_day_strategy.weeks_1_4?.length > 0 && (
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
                    <h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                      <span className="h-6 w-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                      Weeks 1-4
                    </h4>
                    <p className="text-xs text-teal-600 mb-3 font-medium">Foundation Phase</p>
                    <ul className="space-y-2">
                      {analysis.ninety_day_strategy.weeks_1_4.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="h-1.5 w-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weeks 5-8 */}
                {analysis.ninety_day_strategy.weeks_5_8?.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <span className="h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                      Weeks 5-8
                    </h4>
                    <p className="text-xs text-blue-600 mb-3 font-medium">Development Phase</p>
                    <ul className="space-y-2">
                      {analysis.ninety_day_strategy.weeks_5_8.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weeks 9-12 */}
                {analysis.ninety_day_strategy.weeks_9_12?.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <span className="h-6 w-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                      Weeks 9-12
                    </h4>
                    <p className="text-xs text-purple-600 mb-3 font-medium">Implementation Phase</p>
                    <ul className="space-y-2">
                      {analysis.ninety_day_strategy.weeks_9_12.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="h-1.5 w-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
