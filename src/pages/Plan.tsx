import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Target, ArrowRight } from 'lucide-react';
import { usePlans } from '../hooks/usePlan';
import { useAuthStore } from '../store/authStore';
import { useCanvas } from '../hooks/useCanvas';
import PlanBuilder from '../components/plan/PlanBuilder';
import ProgressTimeline from '../components/plan/ProgressTimeline';
import { format, addDays } from 'date-fns';

export default function Plan() {
  const user = useAuthStore((state) => state.user);
  const { plans, createPlan, deletePlan, isLoading, isCreating, isDeleting } = usePlans(user?.id);
  const { canvas, isLoading: isCanvasLoading } = useCanvas(user?.id || '');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Check if career canvas has content
  const hasCareerCanvas = canvas && (
    canvas.section_1_helpers ||
    canvas.section_2_activities ||
    canvas.section_3_value ||
    canvas.section_4_interactions ||
    canvas.section_5_convince ||
    canvas.section_6_skills ||
    canvas.section_7_motivation ||
    canvas.section_8_sacrifices ||
    canvas.section_9_outcomes
  );

  const handleCreatePlanFromCanvas = async () => {
    if (!hasCareerCanvas) return;

    const startDate = new Date();
    const endDate = addDays(startDate, 84); // 12 weeks = 84 days

    try {
      const newPlan = await createPlan({
        title: 'My 90-Day Career Plan',
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      setSelectedPlanId(newPlan.id);
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert('Failed to create plan. Please try again.');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePlan(planId);
      if (selectedPlanId === planId) {
        setSelectedPlanId(null);
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  if (isLoading || isCanvasLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">90-Day Plan</h1>
          <p className="text-gray-600">
            Track your weekly milestones based on your Career Plans
          </p>
        </div>

        {/* Check if user has completed their career canvas first */}
        {!hasCareerCanvas ? (
          <div className="max-w-2xl mx-auto">
            {/* Prompt to complete career canvas first */}
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
                Complete Your Career Plans First
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Before creating your 90-Day Plan, you need to complete your Career Plans.
                This will help generate personalized weekly milestones for your journey.
              </p>
              <Link
                to="/canvas"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Go to Your Career Plans
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start space-x-3">
                <svg
                  className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium text-blue-900">How it works</h3>
                  <p className="mt-1 text-sm text-blue-800">
                    Your 90-Day Plan is generated based on your Career Plans. Complete the 9 sections
                    in Your Career Plans, and we'll create personalized weekly milestones to help you
                    achieve your career goals over the next 12 weeks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            {/* Ready to create 90-day plan */}
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="w-16 h-16 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-success-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
                Your Career Plans is Ready!
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Great job completing your Career Plans! Now let's create your personalized
                90-Day Plan with weekly milestones to help you achieve your goals.
              </p>
              <button
                onClick={handleCreatePlanFromCanvas}
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Plan...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create My 90-Day Plan
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Plan Selector */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select a Plan
                  </label>
                  <select
                    id="plan-select"
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.title} ({format(new Date(plan.start_date), 'MMM d, yyyy')} - {format(new Date(plan.end_date), 'MMM d, yyyy')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {selectedPlanId && (
                    <button
                      onClick={() => handleDeletePlan(selectedPlanId)}
                      disabled={isDeleting}
                      className="p-2 text-error-600 hover:bg-error-50 rounded-xl transition-colors disabled:opacity-50"
                      title="Delete plan"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={handleCreatePlanFromCanvas}
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                    New Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Plan Content */}
            {selectedPlanId && selectedPlan ? (
              <div className="space-y-6">
                {/* Progress Timeline */}
                <ProgressTimeline milestones={selectedPlan.weekly_milestones} />

                {/* Plan Builder */}
                <PlanBuilder planId={selectedPlanId} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center">
                <p className="text-gray-600">Select a plan to view your weekly milestones</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
