import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Users,
  UserCheck,
  Send,
  Check,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getPlanCollaboratorsWithProfiles,
  updatePlanSubmissionStatus,
  type PlanCollaborator,
} from '../../services/collaborator.service';
import {
  getMentorsForJobSeeker,
  type MentorWithAccess,
} from '../../services/mentor.service';

export type ShareMode = 'accountability' | 'mentor';

interface SharePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planTitle: string;
  mode?: ShareMode;
  onSuccess?: () => void;
}

export default function SharePlanModal({
  isOpen,
  onClose,
  planId,
  planTitle,
  mode: initialMode = 'accountability',
  onSuccess,
}: SharePlanModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<ShareMode>(initialMode);
  const [collaborators, setCollaborators] = useState<PlanCollaborator[]>([]);
  const [globalMentors, setGlobalMentors] = useState<MentorWithAccess[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter collaborators by role
  const accountabilityPartners = collaborators.filter(
    (c) => c.role === 'accountability_partner' && c.status === 'accepted'
  );
  const mentorCollaborators = collaborators.filter(
    (c) => c.role === 'mentor' && c.status === 'accepted'
  );

  // Combined mentors list (global + plan-specific)
  const allMentors = [
    ...mentorCollaborators.map((c) => ({
      id: c.id,
      name: c.collaborator_name || c.collaborator_email,
      email: c.collaborator_email,
      source: 'plan' as const,
    })),
    ...globalMentors.map((m) => ({
      id: m.mentor_id,
      name: m.mentor_name || m.mentor_email || 'Mentor',
      email: m.mentor_email || '',
      source: 'global' as const,
    })),
  ];

  // Deduplicate by email
  const uniqueMentors = allMentors.filter(
    (m, i, arr) => arr.findIndex((x) => x.email === m.email) === i
  );

  useEffect(() => {
    if (isOpen && planId && user?.id) {
      setIsLoading(true);
      setError('');
      setSuccess('');
      setSelectedIds([]);

      Promise.all([
        getPlanCollaboratorsWithProfiles(planId),
        getMentorsForJobSeeker(user.id),
      ])
        .then(([collabs, mentors]) => {
          setCollaborators(collabs);
          setGlobalMentors(mentors);
        })
        .catch((err) => {
          console.error('Error loading data:', err);
          setError('Failed to load collaborators');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, planId, user?.id]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmitToMentor = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one mentor');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Update plan status to submitted
      await updatePlanSubmissionStatus(planId, 'submitted');
      setSuccess('Plan submitted for mentor review!');
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWithPartners = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one accountability partner');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // For accountability partners, we just confirm the share
      // They already have access via plan_collaborators
      setSuccess('Plan shared with accountability partners!');
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteNew = () => {
    onClose();
    navigate(`/plans/${planId}/invite`);
  };

  if (!isOpen) return null;

  const currentList =
    mode === 'accountability' ? accountabilityPartners : uniqueMentors;
  const hasNoCollaborators = currentList.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              {mode === 'accountability' ? (
                <Users className="w-5 h-5 text-primary-600" />
              ) : (
                <UserCheck className="w-5 h-5 text-primary-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900">
                {mode === 'accountability'
                  ? 'Share with Partners'
                  : 'Submit to Mentor'}
              </h2>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {planTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setMode('accountability');
              setSelectedIds([]);
              setError('');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'accountability'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Accountability Partners
          </button>
          <button
            onClick={() => {
              setMode('mentor');
              setSelectedIds([]);
              setError('');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              mode === 'mentor'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            Mentors
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : hasNoCollaborators ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {mode === 'accountability' ? (
                  <Users className="w-8 h-8 text-gray-400" />
                ) : (
                  <UserCheck className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 font-medium">
                {mode === 'accountability'
                  ? 'No accountability partners yet'
                  : 'No mentors connected yet'}
              </p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Invite someone to get started
              </p>
              <button
                onClick={handleInviteNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite {mode === 'accountability' ? 'Partner' : 'Mentor'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                {mode === 'accountability'
                  ? 'Select accountability partners to share your progress with:'
                  : 'Select mentors to submit your plan for review:'}
              </p>

              {mode === 'accountability'
                ? accountabilityPartners.map((partner) => (
                    <label
                      key={partner.id}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                        selectedIds.includes(partner.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(partner.id)}
                        onChange={() => handleToggleSelect(partner.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold">
                          {(
                            partner.collaborator_name ||
                            partner.collaborator_email
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {partner.collaborator_name ||
                            partner.collaborator_email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {partner.collaborator_email}
                        </p>
                      </div>
                      <Check
                        className={`w-5 h-5 ${
                          selectedIds.includes(partner.id)
                            ? 'text-primary-600'
                            : 'text-transparent'
                        }`}
                      />
                    </label>
                  ))
                : uniqueMentors.map((mentor) => (
                    <label
                      key={mentor.id}
                      className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                        selectedIds.includes(mentor.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(mentor.id)}
                        onChange={() => handleToggleSelect(mentor.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">
                          {mentor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {mentor.name}
                        </p>
                        {mentor.email && (
                          <p className="text-sm text-gray-500 truncate">
                            {mentor.email}
                          </p>
                        )}
                      </div>
                      <Check
                        className={`w-5 h-5 ${
                          selectedIds.includes(mentor.id)
                            ? 'text-primary-600'
                            : 'text-transparent'
                        }`}
                      />
                    </label>
                  ))}

              {/* Invite More Link */}
              <button
                onClick={handleInviteNew}
                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite {mode === 'accountability' ? 'More Partners' : 'More Mentors'}
              </button>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        {!hasNoCollaborators && !isLoading && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={
                mode === 'accountability'
                  ? handleShareWithPartners
                  : handleSubmitToMentor
              }
              disabled={isSubmitting || selectedIds.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {mode === 'accountability' ? 'Sharing...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {mode === 'accountability'
                    ? `Share with ${selectedIds.length} Partner${selectedIds.length !== 1 ? 's' : ''}`
                    : `Submit to ${selectedIds.length} Mentor${selectedIds.length !== 1 ? 's' : ''}`}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
