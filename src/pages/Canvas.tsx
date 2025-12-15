import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMultipleCanvases, useCanvasById } from '../hooks/useCanvas';
import { usePlans } from '../hooks/usePlan';
import { generateAIMilestones } from '../services/plan.service';
import { linkCanvasToPlan } from '../services/canvas.service';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CanvasBusinessView from '../components/canvas/CanvasBusinessView';
import CareerCanvasEditor from '../components/canvas/CareerCanvas';
import { format, addDays } from 'date-fns';
import {
  Plus,
  Sparkles,
  Save,
  Check,
  FileText,
  ArrowLeft,
  Trash2,
  Eye,
  Edit2,
  Target,
  X,
} from 'lucide-react';
import type { Database } from '../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

type ViewMode = 'list' | 'view' | 'edit';

export default function Canvas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    canvases,
    isLoading,
    canCreateMore,
    maxCanvases,
    create,
    remove,
    isCreating,
    isDeleting,
  } = useMultipleCanvases(user?.id || '');
  const { createPlan } = usePlans(user?.id);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showNewCanvasModal, setShowNewCanvasModal] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');

  // Get selected canvas data
  const selectedCanvas = canvases.find((c) => c.id === selectedCanvasId);

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) return;
    try {
      const newCanvas = await create(newCanvasName.trim());
      setShowNewCanvasModal(false);
      setNewCanvasName('');
      setSelectedCanvasId(newCanvas.id);
      setViewMode('edit');
    } catch (error) {
      console.error('Failed to create canvas:', error);
      alert(error instanceof Error ? error.message : 'Failed to create canvas');
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    if (!confirm('Are you sure you want to delete this career canvas? This action cannot be undone.')) {
      return;
    }
    try {
      await remove(canvasId);
      if (selectedCanvasId === canvasId) {
        setSelectedCanvasId(null);
        setViewMode('list');
      }
    } catch (error) {
      console.error('Failed to delete canvas:', error);
    }
  };

  const handleViewCanvas = (canvasId: string) => {
    setSelectedCanvasId(canvasId);
    setViewMode('view');
  };

  const handleEditCanvas = (canvasId: string) => {
    setSelectedCanvasId(canvasId);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setSelectedCanvasId(null);
    setViewMode('list');
  };

  // Check if canvas has enough content for AI generation
  const getFilledSections = (canvas: Partial<CareerCanvas>) => {
    return [
      canvas?.section_1_helpers,
      canvas?.section_2_activities,
      canvas?.section_3_value,
      canvas?.section_4_interactions,
      canvas?.section_5_convince,
      canvas?.section_6_skills,
      canvas?.section_7_motivation,
      canvas?.section_8_sacrifices,
      canvas?.section_9_outcomes,
    ].filter((s) => s && s.trim().length > 0);
  };

  const handleCreateManualPlan = async (canvas: CareerCanvas) => {
    if (canvas.linked_plan_id) {
      alert('This canvas already has a linked 90-Day Plan.');
      return;
    }

    setIsCreatingManual(true);
    setGenerationError(null);

    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 84);

      const planTitle = canvas?.target_role
        ? `90-Day Plan: ${canvas.target_role}`
        : `90-Day Plan: ${canvas.name}`;

      const newPlan = await createPlan({
        title: planTitle,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      // Link the canvas to the plan
      await linkCanvasToPlan(canvas.id, newPlan.id);

      navigate('/plan');
    } catch (error) {
      console.error('Failed to create plan:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to create plan. Please try again.'
      );
    } finally {
      setIsCreatingManual(false);
    }
  };

  const handleGenerateAIMilestones = async (canvas: CareerCanvas) => {
    if (canvas.linked_plan_id) {
      alert('This canvas already has a linked 90-Day Plan.');
      return;
    }

    const filledSections = getFilledSections(canvas);
    if (filledSections.length < 3) {
      alert('Please fill at least 3 sections before generating AI milestones.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 84);

      const newPlan = await createPlan({
        title: `90-Day Plan: ${canvas.name}`,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      // Generate AI milestones for the plan
      await generateAIMilestones(newPlan.id, {
        section_1_helpers: canvas.section_1_helpers,
        section_2_activities: canvas.section_2_activities,
        section_3_value: canvas.section_3_value,
        section_4_interactions: canvas.section_4_interactions,
        section_5_convince: canvas.section_5_convince,
        section_6_skills: canvas.section_6_skills,
        section_7_motivation: canvas.section_7_motivation,
        section_8_sacrifices: canvas.section_8_sacrifices,
        section_9_outcomes: canvas.section_9_outcomes,
      });

      // Link the canvas to the plan
      await linkCanvasToPlan(canvas.id, newPlan.id);

      navigate('/plan');
    } catch (error) {
      console.error('Failed to generate milestones:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to generate milestones. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // View mode - show single canvas in business view
  if (viewMode === 'view' && selectedCanvas) {
    const filledSections = getFilledSections(selectedCanvas);
    const canGenerateMilestones = filledSections.length >= 3;
    const hasLinkedPlan = !!selectedCanvas.linked_plan_id;

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all canvases
          </button>

          {/* Canvas View */}
          <CanvasBusinessView
            canvas={selectedCanvas}
            canvasName={selectedCanvas.name}
            onEdit={() => handleEditCanvas(selectedCanvas.id)}
            linkedPlanId={selectedCanvas.linked_plan_id}
          />

          {/* Action Buttons */}
          {filledSections.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
                {hasLinkedPlan ? 'Plan Already Created' : 'Next Steps'}
              </h3>
              {hasLinkedPlan ? (
                <div className="flex items-center gap-3">
                  <span className="text-green-600 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    This canvas has a linked 90-Day Plan
                  </span>
                  <button
                    onClick={() => navigate('/plan')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    View Plan
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-6">
                    Create a 90-Day Plan based on this career canvas.
                    {!canGenerateMilestones &&
                      ` (Complete ${3 - filledSections.length} more section${3 - filledSections.length > 1 ? 's' : ''} to enable AI generation)`}
                  </p>
                  {generationError && (
                    <p className="text-sm text-error-600 mb-4">{generationError}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleEditCanvas(selectedCanvas.id)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                      Edit Canvas
                    </button>

                    <button
                      onClick={() => handleCreateManualPlan(selectedCanvas)}
                      disabled={isCreatingManual}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingManual ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Create Manual Plan
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerateAIMilestones(selectedCanvas)}
                      disabled={!canGenerateMilestones || isGenerating}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate with AI
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit mode - show editor
  if (viewMode === 'edit' && selectedCanvasId) {
    return (
      <CanvasEditorWrapper
        canvasId={selectedCanvasId}
        onBack={handleBackToList}
        onViewMode={() => setViewMode('view')}
      />
    );
  }

  // List mode - show all canvases
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Your Career Plans</h1>
            <p className="text-gray-600">
              Create up to {maxCanvases} career canvases to map different career paths.
            </p>
          </div>
          {canCreateMore && (
            <button
              onClick={() => setShowNewCanvasModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Canvas
            </button>
          )}
        </div>

        {/* Canvas Cards Grid */}
        {canvases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
              Start Your Career Canvas
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              A Career Canvas helps you visualize and plan your career by answering key questions
              about your goals, skills, and aspirations.
            </p>
            <button
              onClick={() => setShowNewCanvasModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Canvas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {canvases.map((canvas) => {
              const filledSections = getFilledSections(canvas);
              const hasLinkedPlan = !!canvas.linked_plan_id;

              return (
                <div
                  key={canvas.id}
                  className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-all"
                >
                  {/* Canvas Preview Header */}
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-gray-900">
                            {canvas.target_role || canvas.name || 'Career Canvas'}
                          </h3>
                          <p className="text-sm text-gray-600">Career Canvas</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCanvas(canvas.id)}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete canvas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Canvas Stats */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          {filledSections.length}/9 sections filled
                        </span>
                        <span className="text-primary-600 font-medium">
                          {canvas.completion_percentage || 0}% complete
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${canvas.completion_percentage || 0}%` }}
                      />
                    </div>

                    {/* Plan Status */}
                    {hasLinkedPlan && (
                      <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        90-Day Plan linked
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewCanvas(canvas.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditCanvas(canvas.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Canvas Card */}
            {canCreateMore && (
              <button
                onClick={() => setShowNewCanvasModal(true)}
                className="bg-white rounded-2xl shadow-card p-6 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center min-h-[280px] group"
              >
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary-600" />
                </div>
                <span className="font-medium text-gray-600 group-hover:text-primary-700">
                  Create New Canvas
                </span>
                <span className="text-sm text-gray-400 mt-1">
                  {canvases.length}/{maxCanvases} used
                </span>
              </button>
            )}
          </div>
        )}

        {/* New Canvas Modal */}
        {showNewCanvasModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-gray-900">
                  Create New Career Canvas
                </h3>
                <button
                  onClick={() => {
                    setShowNewCanvasModal(false);
                    setNewCanvasName('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Canvas
                </label>
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="e.g., Senior Product Manager, Data Scientist, UX Designer..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  autoFocus
                />
                <p className="mt-2 text-sm text-gray-500">
                  What role are you targeting? This helps focus your career planning.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewCanvasModal(false);
                    setNewCanvasName('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCanvas}
                  disabled={!newCanvasName.trim() || isCreating}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Canvas'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper component for canvas editor with its own data fetching
function CanvasEditorWrapper({
  canvasId,
  onBack,
  onViewMode,
}: {
  canvasId: string;
  onBack: () => void;
  onViewMode: () => void;
}) {
  const { canvas, isLoading, save, isSaving } = useCanvasById(canvasId);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleExplicitSave = async () => {
    if (!canvas) return;
    try {
      await save(canvas);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Canvas not found</h2>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Canvases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all canvases
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExplicitSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-success-600 text-white font-medium rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : showSaveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={onViewMode}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Canvas
            </button>
          </div>
        </div>

        {/* Editor */}
        <CareerCanvasEditor canvas={canvas} onSave={save} isSaving={isSaving} />
      </div>
    </div>
  );
}
