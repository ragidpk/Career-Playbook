import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Target, ArrowRight, Calendar, ChevronRight, Edit2, Users, UserCheck, Sparkles, FileText } from 'lucide-react';
import { usePlans, usePlan } from '../hooks/usePlan';
import { useAuthStore } from '../store/authStore';
import { useCanvas } from '../hooks/useCanvas';
import { format, addDays } from 'date-fns';
import NewPlanModal from '../components/plan/NewPlanModal';
import MilestoneGrid from '../components/plan/MilestoneGrid';
import SharePlanModal, { type ShareMode } from '../components/shared/SharePlanModal';
import { generateAIMilestones, updateMilestone } from '../services/plan.service';
import { useQueryClient } from '@tanstack/react-query';

export default function Plan() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { plans, createPlan, isLoading, isCreating } = usePlans(user?.id);
  const { canvas, isLoading: isCanvasLoading } = useCanvas(user?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showContinuationModal, setShowContinuationModal] = useState(false);
  const [continuationTitle, setContinuationTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState<ShareMode>('accountability');

  // For single plan view, get the plan details
  const singlePlanId = plans.length === 1 ? plans[0].id : undefined;
  const { plan: singlePlanDetails, milestones: singlePlanMilestones, createContinuationPlan, isCreatingContinuation } = usePlan(singlePlanId);

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

  const handleCreatePlan = async (title: string, startDate: string, templateId: string | null) => {
    const endDate = addDays(new Date(startDate), 84); // 12 weeks = 84 days

    try {
      const newPlan = await createPlan({
        plan: {
          title,
          start_date: startDate,
          end_date: format(endDate, 'yyyy-MM-dd'),
        },
        templateId,
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

  const handleCreateContinuation = async () => {
    if (!singlePlanId || !user?.id || !continuationTitle.trim()) return;

    try {
      const newPlan = await createContinuationPlan({
        userId: user.id,
        parentPlanId: singlePlanId,
        title: continuationTitle.trim(),
      });
      setShowContinuationModal(false);
      setContinuationTitle('');
      navigate(`/plans/${newPlan.id}`);
    } catch (error) {
      console.error('Failed to create continuation plan:', error);
      alert('Failed to create continuation plan. Please try again.');
    }
  };

  const handleToggleComplete = async (milestoneId: string, currentStatus: string) => {
    type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';
    let newStatus: MilestoneStatus;
    if (currentStatus === 'not_started') {
      newStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      newStatus = 'completed';
    } else {
      newStatus = 'not_started';
    }
    try {
      await updateMilestone(milestoneId, { status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ['plan', singlePlanId] });
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  };

  const handleGenerateAI = async () => {
    if (!singlePlanId || !canvas) return;

    setIsGenerating(true);
    try {
      await generateAIMilestones(singlePlanId, {
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
      await queryClient.invalidateQueries({ queryKey: ['plan', singlePlanId] });
    } catch (error) {
      console.error('Failed to generate milestones:', error);
      alert('Failed to generate milestones. Please try again.');
    } finally {
      setIsGenerating(false);
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

  // Single plan view - show plan directly with action bar
  if (hasCareerCanvas && plans.length === 1 && singlePlanDetails) {
    const completedMilestones = singlePlanMilestones.filter(m => m.status === 'completed').length;
    const totalMilestones = singlePlanMilestones.length;
    const progressPercentage = totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;
    const hasMilestoneContent = singlePlanMilestones.some(m => m.goal);

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Top Action Bar */}
          <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">12 Weeks Career Plan</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {singlePlanDetails.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowContinuationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Next 12 Weeks
                </button>
                <Link
                  to={`/plans/${singlePlanId}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Plan
                </Link>
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
              </div>
            </div>
          </div>

          {/* Plan Info Card */}
          <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-gray-900">{singlePlanDetails.title}</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(singlePlanDetails.start_date), 'MMM d')} - {format(new Date(singlePlanDetails.end_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary-600">{progressPercentage}%</span>
                <p className="text-sm text-gray-500">{completedMilestones}/{totalMilestones} milestones</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-gray-900">
                12-Week Milestone Timeline
              </h3>
            </div>

            {!hasMilestoneContent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Your Timeline</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Choose how you'd like to create your 12-week milestone timeline
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to={`/plans/${singlePlanId}/edit`}
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    Create Manual Timeline
                  </Link>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !canvas}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-primary-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-primary-700 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate AI Timeline
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <MilestoneGrid
                planTitle={singlePlanDetails.title}
                planStartDate={singlePlanDetails.start_date}
                milestones={singlePlanMilestones}
                feedbackMap={{}}
                commentsMap={{}}
                onToggleComplete={handleToggleComplete}
                readOnly={false}
                showFeedback={false}
                currentUserId={user?.id}
              />
            )}
          </div>

          {/* Continuation Plan Modal */}
          {showContinuationModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
                  Add Next 12 Weeks
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Create a continuation plan that starts after your current plan ends ({format(new Date(singlePlanDetails.end_date), 'MMM d, yyyy')}).
                </p>
                <div className="mb-6">
                  <label htmlFor="continuationTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Plan Title
                  </label>
                  <input
                    id="continuationTitle"
                    type="text"
                    value={continuationTitle}
                    onChange={(e) => setContinuationTitle(e.target.value)}
                    placeholder={`${singlePlanDetails.title} - Part 2`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowContinuationModal(false);
                      setContinuationTitle('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateContinuation}
                    disabled={isCreatingContinuation || !continuationTitle.trim()}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {isCreatingContinuation ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Share Plan Modal */}
          <SharePlanModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            planId={singlePlanId || ''}
            planTitle={singlePlanDetails.title}
            mode={shareMode}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['plan', singlePlanId] })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">12 Weeks Career Plan</h1>
          <p className="text-gray-600">
            Track your weekly milestones based on your Career Goal
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
                Before creating your 12 Weeks Career Plan, you need to complete your Career Goal.
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
                    Your 12 Weeks Career Plan is generated based on your Career Goal. Complete the 9 sections
                    in Your Career Goal, and we'll create personalized weekly milestones to help you
                    achieve your career goals over the next 12 weeks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            {/* Ready to create 12 weeks plan */}
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
                Great job completing your Career Goal! Now let's create your personalized
                12 Weeks Career Plan with weekly milestones to help you achieve your goals.
              </p>
              <button
                onClick={openNewPlanModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create My 12 Weeks Plan
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
