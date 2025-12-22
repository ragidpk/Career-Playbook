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
import CreateCanvasModal from '../components/canvas/CreateCanvasModal';
import CanvasWizard from '../components/canvas/CanvasWizard';
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
  Users,
  UserCheck,
} from 'lucide-react';
import SharePlanModal, { type ShareMode } from '../components/shared/SharePlanModal';
import type { Database } from '../types/database.types';

type CareerCanvas = Database['public']['Tables']['career_canvas']['Row'];

type ViewMode = 'list' | 'view' | 'edit' | 'wizard';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('accountability');

  // Get selected canvas data
  const selectedCanvas = canvases.find((c) => c.id === selectedCanvasId);

  const handleCreateCanvas = async (data: {
    currentRole: string;
    targetRole: string;
    targetDate: string;
    industry: string;
  }) => {
    try {
      const newCanvas = await create({
        targetRole: data.targetRole,
        currentRole: data.currentRole,
        targetDate: data.targetDate,
        industry: data.industry,
      });
      setShowNewCanvasModal(false);
      setSelectedCanvasId(newCanvas.id);
      setViewMode('wizard'); // Start wizard flow for new canvas
    } catch (error) {
      console.error('Failed to create canvas:', error);
      throw error;
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
    setViewMode('wizard'); // Use wizard for editing
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
      alert('This canvas already has a linked 12 Weeks Plan.');
      return;
    }

    setIsCreatingManual(true);
    setGenerationError(null);

    try {
      const startDate = new Date();
      const endDate = addDays(startDate, 84);

      const planTitle = canvas?.target_role
        ? `12 Weeks Plan: ${canvas.target_role}`
        : `12 Weeks Plan: ${canvas.name}`;

      const newPlan = await createPlan({
        plan: {
          title: planTitle,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        },
        templateId: null,
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
      alert('This canvas already has a linked 12 Weeks Plan.');
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
        plan: {
          title: `12 Weeks Plan: ${canvas.name}`,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        },
        templateId: null,
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

  // Single canvas mode - show canvas view directly with action bar
  if (canvases.length === 1 && viewMode === 'list') {
    const singleCanvas = canvases[0];
    const filledSections = getFilledSections(singleCanvas);
    const canGenerateMilestones = filledSections.length >= 3;
    const hasLinkedPlan = !!singleCanvas.linked_plan_id;

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Action Bar */}
          <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Career Goal</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {singleCanvas.target_role || 'Your career canvas'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowNewCanvasModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Another
                </button>
                <button
                  onClick={() => handleEditCanvas(singleCanvas.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Canvas
                </button>
                {singleCanvas.linked_plan_id ? (
                  <>
                    <button
                      onClick={() => {
                        setShareMode('accountability');
                        setShowShareModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Share with Partners
                    </button>
                    <button
                      onClick={() => {
                        setShareMode('mentor');
                        setShowShareModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Submit to Mentor
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate('/mentoring')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Share with Mentor
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Canvas View */}
          <CanvasBusinessView
            canvas={singleCanvas}
            canvasName={singleCanvas.name}
            linkedPlanId={singleCanvas.linked_plan_id}
          />

          {/* Action Buttons - Next Steps */}
          {filledSections.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">
                {hasLinkedPlan ? 'Plan Already Created' : 'Next Steps'}
              </h3>
              {hasLinkedPlan ? (
                <div className="flex items-center gap-3">
                  <span className="text-green-600 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    This canvas has a linked 12 Weeks Plan
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
                    Create a 12 Weeks Career Plan based on this career canvas.
                    {!canGenerateMilestones &&
                      ` (Complete ${3 - filledSections.length} more section${3 - filledSections.length > 1 ? 's' : ''} to enable AI generation)`}
                  </p>
                  {generationError && (
                    <p className="text-sm text-error-600 mb-4">{generationError}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleCreateManualPlan(singleCanvas)}
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
                      onClick={() => handleGenerateAIMilestones(singleCanvas)}
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

        {/* New Canvas Modal */}
        <CreateCanvasModal
          isOpen={showNewCanvasModal}
          onClose={() => setShowNewCanvasModal(false)}
          onCreate={handleCreateCanvas}
          isCreating={isCreating}
        />

        {/* Share Plan Modal */}
        {singleCanvas.linked_plan_id && (
          <SharePlanModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            planId={singleCanvas.linked_plan_id}
            planTitle={singleCanvas.target_role || singleCanvas.name}
            mode={shareMode}
          />
        )}
      </div>
    );
  }

  // View mode - show single canvas in business view (when selected from list)
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
                    This canvas has a linked 12 Weeks Plan
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
                    Create a 12 Weeks Career Plan based on this career canvas.
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

  // Wizard mode - step-by-step question flow
  if (viewMode === 'wizard' && selectedCanvasId) {
    return (
      <CanvasWizardWrapper
        canvasId={selectedCanvasId}
        onBack={handleBackToList}
        onComplete={() => {
          // If only 1 canvas, go back to list to show single canvas view
          // If multiple, go to view mode
          if (canvases.length === 1) {
            setViewMode('list');
          } else {
            setViewMode('view');
          }
        }}
      />
    );
  }

  // Edit mode - show editor (legacy full form)
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
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Career Goal</h1>
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
                        12 Weeks Plan linked
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
        <CreateCanvasModal
          isOpen={showNewCanvasModal}
          onClose={() => setShowNewCanvasModal(false)}
          onCreate={handleCreateCanvas}
          isCreating={isCreating}
        />
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

// Wrapper component for canvas wizard with its own data fetching
function CanvasWizardWrapper({
  canvasId,
  onBack,
  onComplete,
}: {
  canvasId: string;
  onBack: () => void;
  onComplete: () => void;
}) {
  const { canvas, isLoading, save, saveImmediate, isSaving } = useCanvasById(canvasId);

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all canvases
          </button>
          <div className="text-right">
            <h1 className="text-xl font-display font-bold text-gray-900">
              {canvas.target_role || 'Career Goal'}
            </h1>
            {(canvas as any).current_role && (
              <p className="text-sm text-gray-500">
                From: {(canvas as any).current_role}
              </p>
            )}
          </div>
        </div>

        {/* Wizard */}
        <CanvasWizard
          canvas={canvas}
          onSave={save}
          onSaveImmediate={saveImmediate}
          onComplete={onComplete}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
