import { useState } from 'react';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import Card from '../shared/Card';
import ATSScore from './ATSScore';

interface AnalysisResultsProps {
  analysis: {
    ats_score: number;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
  };
  remainingAnalyses: number;
}

type TabType = 'strengths' | 'gaps' | 'recommendations';

export default function AnalysisResults({ analysis, remainingAnalyses }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('strengths');

  const tabs = [
    { id: 'strengths' as TabType, label: 'Strengths', icon: CheckCircle, color: 'text-green-600' },
    { id: 'gaps' as TabType, label: 'Areas to Improve', icon: AlertTriangle, color: 'text-yellow-600' },
    { id: 'recommendations' as TabType, label: 'Recommendations', icon: Lightbulb, color: 'text-blue-600' },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'strengths':
        return analysis.strengths;
      case 'gaps':
        return analysis.gaps;
      case 'recommendations':
        return analysis.recommendations;
    }
  };

  const getTabIcon = () => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return null;
    const Icon = tab.icon;
    return <Icon className={`h-5 w-5 ${tab.color}`} />;
  };

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

      {/* ATS Score Card */}
      <Card>
        <div className="p-6 flex flex-col items-center">
          <ATSScore score={analysis.ats_score} size="lg" />
          <div className="mt-6 text-center max-w-md">
            <p className="text-sm text-gray-600">
              {analysis.ats_score <= 30 &&
                'Your resume needs significant improvements to pass through Applicant Tracking Systems. Focus on the recommendations below to increase your chances.'}
              {analysis.ats_score > 30 && analysis.ats_score <= 70 &&
                'Your resume has a decent chance of passing through ATS, but there\'s room for improvement. Review the recommendations to optimize your resume.'}
              {analysis.ats_score > 70 &&
                'Excellent! Your resume is well-optimized for ATS. Keep refining it with the recommendations to maintain this strong performance.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Analysis Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-4 px-4 text-center border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {getTabContent().length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No {activeTab} found in the analysis.
              </p>
            ) : (
              getTabContent().map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getTabIcon()}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{item}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
