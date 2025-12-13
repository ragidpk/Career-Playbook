import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCanvas } from '../hooks/useCanvas';
import { usePlans } from '../hooks/usePlan';
import { generateAIMilestones } from '../services/plan.service';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CareerCanvas from '../components/canvas/CareerCanvas';
import { format, addDays } from 'date-fns';
import { Sparkles } from 'lucide-react';

export default function Canvas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canvas, isLoading, save, isSaving } = useCanvas(user?.id || '');
  const { createPlan } = usePlans(user?.id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Check if canvas has enough content for AI generation
  const filledSections = [
    canvas?.section_1_helpers,
    canvas?.section_2_activities,
    canvas?.section_3_value,
    canvas?.section_4_interactions,
    canvas?.section_5_convince,
    canvas?.section_6_skills,
    canvas?.section_7_motivation,
    canvas?.section_8_sacrifices,
    canvas?.section_9_outcomes,
  ].filter(s => s && s.trim().length > 0);

  const canGenerateMilestones = filledSections.length >= 3;

  const handleGenerateAIMilestones = async () => {
    if (!canvas || !canGenerateMilestones) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Create a new 90-day plan
      const startDate = new Date();
      const endDate = addDays(startDate, 84);

      const newPlan = await createPlan({
        title: 'My 90-Day Career Plan',
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

      // Navigate to the 90-Day Plan page
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <CareerCanvas canvas={canvas || {}} onSave={save} isSaving={isSaving} />

        {/* AI Milestone Generation Section - Show when canvas has content */}
        {filledSections.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-primary-50 to-info-50 rounded-2xl p-6 border border-primary-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-gray-900">
                    Generate AI-Powered 90-Day Plan
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {canGenerateMilestones ? (
                      'Create personalized weekly milestones based on your Career Plans using AI.'
                    ) : (
                      `Complete at least 3 sections to generate milestones (${filledSections.length}/3 completed).`
                    )}
                  </p>
                  {generationError && (
                    <p className="text-sm text-error-600 mt-2">{generationError}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleGenerateAIMilestones}
                disabled={!canGenerateMilestones || isGenerating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate 90-Day Plan
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
