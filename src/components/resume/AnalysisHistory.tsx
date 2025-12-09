import { useState } from 'react';
import { FileText, Calendar, TrendingUp } from 'lucide-react';
import Card from '../shared/Card';
import ATSScore from './ATSScore';

interface Analysis {
  id: string;
  file_name: string;
  ats_score: number;
  analysis_date: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

interface AnalysisHistoryProps {
  analyses: Analysis[];
  onSelectAnalysis: (analysis: Analysis) => void;
}

export default function AnalysisHistory({ analyses, onSelectAnalysis }: AnalysisHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (analysis: Analysis) => {
    setSelectedId(analysis.id);
    onSelectAnalysis(analysis);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (analyses.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis History</h3>
          <p className="text-sm text-gray-500">
            Upload and analyze your first resume to see results here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Analysis History</h3>
          <span className="ml-auto text-sm text-gray-500">{analyses.length} total</span>
        </div>

        <div className="space-y-3">
          {analyses.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => handleSelect(analysis)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${
                  selectedId === analysis.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {/* ATS Score */}
                <div className="flex-shrink-0">
                  <ATSScore score={analysis.ats_score} size="sm" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {analysis.file_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(analysis.analysis_date)}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="hidden sm:flex flex-col gap-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="w-16 text-right">{analysis.strengths.length}</span>
                    <span>strengths</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-16 text-right">{analysis.gaps.length}</span>
                    <span>gaps</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
