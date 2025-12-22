import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Target,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Send,
  Plus,
} from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useCanvas } from '../hooks/useCanvas';
import { useAuth } from '../hooks/useAuth';
import { deletePlan, generateAIMilestones, updateMilestone } from '../services/plan.service';
import { getPlanCollaboratorsWithProfiles, updatePlanSubmissionStatus, type PlanCollaborator } from '../services/collaborator.service';
import { getMentorsForJobSeeker, type MentorWithAccess } from '../services/mentor.service';
import { getPlanFeedbackLatest, getPlanComments, type MilestoneFeedback, type MilestoneComment } from '../services/feedback.service';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import MilestoneGrid from '../components/plan/MilestoneGrid';
import { format } from 'date-fns';

// Submission status display config
const submissionStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Not submitted', color: 'text-gray-600' },
  submitted: { label: 'Submitted', color: 'text-blue-600' },
  under_review: { label: 'Under review', color: 'text-yellow-600' },
  approved: { label: 'Approved', color: 'text-green-600' },
};

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { plan, milestones, isLoading: planLoading, createContinuationPlan, isCreatingContinuation } = usePlan(id);
  const { canvas, isLoading: canvasLoading } = useCanvas(user?.id || '');
  const [collaborators, setCollaborators] = useState<PlanCollaborator[]>([]);
  const [globalMentors, setGlobalMentors] = useState<MentorWithAccess[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContinuationModal, setShowContinuationModal] = useState(false);
  const [continuationTitle, setContinuationTitle] = useState('');
  const [showTimeline, setShowTimeline] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, MilestoneFeedback>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, MilestoneComment[]>>({});

  // Load collaborators with profile info
  useEffect(() => {
    if (id) {
      getPlanCollaboratorsWithProfiles(id)
        .then(setCollaborators)
        .catch((err) => {
          // Don't silently fail - log and show error for non-404 errors
          if (err?.code !== '42P01') {
            console.error('Error loading collaborators:', err);
            setDataError('Failed to load collaborators');
          }
        });
    }
  }, [id]);

  // Load global mentors (from mentor_access table)
  useEffect(() => {
    if (user?.id) {
      getMentorsForJobSeeker(user.id)
        .then(setGlobalMentors)
        .catch((err) => {
          console.error('Error loading global mentors:', err);
        });
    }
  }, [user?.id]);

  // Load feedback and comments from mentors
  useEffect(() => {
    if (id) {
      getPlanFeedbackLatest(id).then(setFeedbackMap).catch(console.error);
      getPlanComments(id).then(setCommentsMap).catch(console.error);
    }
  }, [id]);

  // Calculate progress
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const totalMilestones = milestones.length;
  const progressPercentage = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePlan(id);
      // Invalidate plans list cache so deleted plan doesn't show
      await queryClient.invalidateQueries({ queryKey: ['plans'] });
      navigate('/plan');
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete plan. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async (milestoneId: string, currentStatus: string) => {
    // Cycle: not_started → in_progress → completed → not_started
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
      await queryClient.invalidateQueries({ queryKey: ['plan', id] });
    } catch (error) {
      console.error('Failed to update milestone:', error);
      alert('Failed to update milestone. Please try again.');
    }
  };

  const handleGenerateAI = async () => {
    if (!id || !canvas) return;

    setIsGenerating(true);
    try {
      await generateAIMilestones(id, {
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
      // Invalidate plan query to refetch data without full page reload
      await queryClient.invalidateQueries({ queryKey: ['plan', id] });
    } catch (error) {
      console.error('Failed to generate milestones:', error);
      alert('Failed to generate milestones. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!id) return;

    if (!confirm('Submit this plan to your mentor for review?')) return;

    setIsSubmitting(true);
    try {
      await updatePlanSubmissionStatus(id, 'submitted');
      await queryClient.invalidateQueries({ queryKey: ['plan', id] });
    } catch (error) {
      console.error('Failed to submit plan:', error);
      alert('Failed to submit plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateContinuation = async () => {
    if (!id || !user?.id || !continuationTitle.trim()) return;

    try {
      const newPlan = await createContinuationPlan({
        userId: user.id,
        parentPlanId: id,
        title: continuationTitle.trim(),
      });
      setShowContinuationModal(false);
      setContinuationTitle('');
      // Navigate to the new plan
      navigate(`/plans/${newPlan.id}`);
    } catch (error) {
      console.error('Failed to create continuation plan:', error);
      alert('Failed to create continuation plan. Please try again.');
    }
  };

  if (planLoading || canvasLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan Not Found</h1>
          <p className="text-gray-600 mb-6">The plan you're looking for doesn't exist or has been deleted.</p>
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
          >
            Go to Plans
          </Link>
        </div>
      </div>
    );
  }

  const acceptedCollaborators = collaborators.filter((c) => c.status === 'accepted');

  // Combine plan-specific collaborator mentors and global mentors for display
  const planMentors = acceptedCollaborators.filter(c => c.role === 'mentor');
  const allMentorNames = [
    ...planMentors.map(c => c.collaborator_name || c.collaborator_email),
    ...globalMentors.map(m => m.mentor_name || 'Mentor'),
  ];
  const hasMentor = allMentorNames.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">{plan.title}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Created {format(new Date(plan.created_at), 'MM/dd/yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowContinuationModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Next 12 Weeks
              </button>
              <Link
                to={`/plans/${id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Plan
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Plan
              </button>
            </div>
          </div>

          {/* Status Row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
            {/* Submission Status */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Submission Status:</span>
              <span className={submissionStatusConfig[(plan as any).submission_status || 'draft']?.color || 'text-gray-600'}>
                {submissionStatusConfig[(plan as any).submission_status || 'draft']?.label || 'Not submitted'}
              </span>
            </div>
            {((plan as any).submission_status || 'draft') === 'draft' && !hasMentor && (
              <span className="text-gray-400 italic">
                Add a mentor to submit your plan for review
              </span>
            )}
            {((plan as any).submission_status || 'draft') === 'draft' && hasMentor && (
              <button
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
            {dataError && (
              <span className="text-red-500 text-xs">{dataError}</span>
            )}
          </div>

          {/* Collaborators & Progress */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">
                  {hasMentor ? (
                    <>Mentor: {allMentorNames.join(', ')}</>
                  ) : (
                    <>Collaborators ({acceptedCollaborators.length})</>
                  )}
                </span>
              </div>
              <Link
                to={`/plans/${id}/collaborators`}
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-primary-600">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedMilestones} of {totalMilestones} milestones completed
            </p>
          </div>
        </div>

        {/* 12-Week Milestone Timeline */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-display font-semibold text-gray-900">
                12-Week Milestone Timeline
              </h2>
            </div>
            {showTimeline ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showTimeline && (
            <div className="mt-6">
              {milestones.length === 0 || !milestones.some((m) => m.goal) ? (
                /* Empty State - Create Timeline Options */
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
                      to={`/plans/${id}/edit`}
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
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
                /* Milestone Grid with Feedback */
                <MilestoneGrid
                  planTitle={plan.title}
                  planStartDate={plan.start_date}
                  milestones={milestones}
                  feedbackMap={feedbackMap}
                  commentsMap={commentsMap}
                  onToggleComplete={handleToggleComplete}
                  onCommentAdded={(milestoneId, comment) => {
                    setCommentsMap(prev => ({
                      ...prev,
                      [milestoneId]: [...(prev[milestoneId] || []), comment]
                    }));
                  }}
                  readOnly={false}
                  showFeedback={true}
                  currentUserId={user?.id}
                />
              )}
            </div>
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
                Create a continuation plan that starts after your current plan ends ({plan?.end_date ? format(new Date(plan.end_date), 'MMM d, yyyy') : ''}).
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
                  placeholder={`${plan?.title || 'Plan'} - Part ${(plan?.sequence_number || 1) + 1}`}
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
      </div>
    </div>
  );
}
