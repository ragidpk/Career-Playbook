import { useState } from 'react';
import { FileText, Calendar, TrendingUp, Trash2, Globe } from 'lucide-react';
import Card from '../shared/Card';
import ATSScore from './ATSScore';

interface Analysis {
  id: string;
  file_name: string;
  file_url: string;
  ats_score: number;
  analysis_date: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  candidate_name?: string;
  target_country?: string;
}

interface AnalysisHistoryProps {
  analyses: Analysis[];
  onSelectAnalysis: (analysis: Analysis) => void;
  onDeleteAnalysis?: (analysisId: string, filePath: string) => Promise<void>;
}

export default function AnalysisHistory({ analyses, onSelectAnalysis, onDeleteAnalysis }: AnalysisHistoryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSelect = (analysis: Analysis) => {
    setSelectedId(analysis.id);
    onSelectAnalysis(analysis);
  };

  const handleDeleteClick = (e: React.MouseEvent, analysisId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(analysisId);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, analysis: Analysis) => {
    e.stopPropagation();
    if (!onDeleteAnalysis) return;

    try {
      setDeletingId(analysis.id);
      await onDeleteAnalysis(analysis.id, analysis.file_url);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
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
            <div
              key={analysis.id}
              className={`
                relative rounded-lg border-2 transition-all
                ${
                  selectedId === analysis.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              {/* Confirmation overlay */}
              {confirmDeleteId === analysis.id && (
                <div className="absolute inset-0 bg-white/95 rounded-lg flex items-center justify-center z-10 p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-700 mb-3">Delete this analysis?</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={(e) => handleConfirmDelete(e, analysis)}
                        disabled={deletingId === analysis.id}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === analysis.id ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleSelect(analysis)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center gap-4">
                  {/* ATS Score */}
                  <div className="flex-shrink-0">
                    <ATSScore score={analysis.ats_score} size="sm" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    {/* Show candidate name as title if available */}
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {analysis.candidate_name || analysis.file_name}
                    </p>
                    {/* Show file name below if we have candidate name */}
                    {analysis.candidate_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{analysis.file_name}</span>
                      </div>
                    )}
                    {analysis.target_country && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Globe className="h-3 w-3" />
                        <span>{analysis.target_country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(analysis.analysis_date)}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {onDeleteAnalysis && (
                    <button
                      onClick={(e) => handleDeleteClick(e, analysis.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Delete analysis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
