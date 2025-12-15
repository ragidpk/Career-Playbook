import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Target, ArrowRight, Calendar, ChevronRight } from 'lucide-react';
import { usePlans } from '../hooks/usePlan';
import { useAuthStore } from '../store/authStore';
import { useCanvas } from '../hooks/useCanvas';
import { format, addDays } from 'date-fns';
import NewPlanModal from '../components/plan/NewPlanModal';

export default function Plan() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { plans, createPlan, isLoading, isCreating } = usePlans(user?.id);
  const { canvas, isLoading: isCanvasLoading } = useCanvas(user?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCreatePlan = async (title: string, startDate: string, _templateId: string | null) => {
    const endDate = addDays(new Date(startDate), 84); // 12 weeks = 84 days

    try {
      const newPlan = await createPlan({
        title,
        start_date: startDate,
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      setIsModalOpen(false);
      // Navigate to the new plan detail page
      navigate(`/plans/${newPlan.id}`);
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert('Failed to create plan. Please try again.');
    }
  };

  const openNewPlanModal = () => {
    setIsModalOpen(true);
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
                onClick={openNewPlanModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create My 90-Day Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with New Plan Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold text-gray-900">Your Plans</h2>
                <p className="text-sm text-gray-500">{plans.length} plan{plans.length !== 1 ? 's' : ''} created</p>
              </div>
              <button
                onClick={openNewPlanModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Plan
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const completedMilestones = plan.weekly_milestones.filter(m => m.status === 'completed').length;
                const totalMilestones = plan.weekly_milestones.length;
                const progressPercentage = totalMilestones > 0
                  ? Math.round((completedMilestones / totalMilestones) * 100)
                  : 0;

                return (
                  <Link
                    key={plan.id}
                    to={`/plans/${plan.id}`}
                    className="group bg-white rounded-2xl shadow-card hover:shadow-card-hover p-6 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                        <Target className="w-5 h-5 text-primary-600" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>

                    <h3 className="font-display font-semibold text-gray-900 mb-2 line-clamp-1">
                      {plan.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(plan.start_date), 'MMM d')} - {format(new Date(plan.end_date), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-primary-600">{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {completedMilestones}/{totalMilestones} milestones
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* New Plan Modal */}
        <NewPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreatePlan={handleCreatePlan}
          isCreating={isCreating}
        />
      </div>
    </div>
  );
}
