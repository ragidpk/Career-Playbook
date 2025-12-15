import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Mail,
  Send,
  Clock,
  Check,
  X,
  Trash2,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { usePlan } from '../hooks/usePlan';
import { useAuth } from '../hooks/useAuth';
import {
  inviteCollaborator,
  getPlanCollaboratorsWithProfiles,
  removeCollaborator,
  type PlanCollaborator,
  type CollaboratorRole,
} from '../services/collaborator.service';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const roleOptions: { value: CollaboratorRole; label: string; description: string }[] = [
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Can view your plan, provide feedback, and approve submissions',
  },
  {
    value: 'accountability_partner',
    label: 'Accountability Partner',
    description: 'Can view your progress and help keep you on track',
  },
];

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pending',
  },
  accepted: {
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Accepted',
  },
  declined: {
    icon: X,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Declined',
  },
};

export default function InviteCollaborators() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { plan, isLoading: planLoading } = usePlan(id);
  const [collaborators, setCollaborators] = useState<PlanCollaborator[]>([]);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(true);

  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<CollaboratorRole>('accountability_partner');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get user's name for the message template
  const userName = user?.user_metadata?.full_name || 'A job seeker';

  // Default message template
  const getDefaultMessage = (planTitle: string) => {
    return `Hi,

I'm using Career Playbook to plan my career journey and would love to have you as my ${role === 'mentor' ? 'mentor' : 'accountability partner'}.

I'm working on a plan called "${planTitle}" and your guidance would be invaluable.

Looking forward to connecting with you!

Best regards,
${userName}`;
  };

  // Update message when role or plan changes
  useEffect(() => {
    if (plan?.title) {
      setPersonalMessage(getDefaultMessage(plan.title));
    }
  }, [plan?.title, role, userName]);

  // Load collaborators
  useEffect(() => {
    if (id) {
      setIsLoadingCollaborators(true);
      getPlanCollaboratorsWithProfiles(id)
        .then(setCollaborators)
        .catch(console.error)
        .finally(() => setIsLoadingCollaborators(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if already invited
    if (collaborators.some(c => c.collaborator_email.toLowerCase() === email.toLowerCase())) {
      setError('This person has already been invited');
      return;
    }

    setIsSubmitting(true);

    try {
      await inviteCollaborator({
        planId: id!,
        email,
        role,
        personalMessage,
        jobSeekerName: userName,
        planTitle: plan?.title || 'Career Plan',
      });

      setSuccess(`Invitation sent to ${email}!`);
      setEmail('');

      // Refresh collaborators list
      const updated = await getPlanCollaboratorsWithProfiles(id!);
      setCollaborators(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await removeCollaborator(collaboratorId);
      setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
    } catch (err) {
      alert('Failed to remove collaborator');
    }
  };

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Plan Not Found</h1>
          <Link to="/plan" className="text-primary-600 hover:text-primary-700">
            Go to Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          to={`/plans/${id}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Plan
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Invite Collaborators</h1>
            <p className="text-gray-500">{plan.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Invitation Form */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Send Invitation</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="collaborator@example.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roleOptions.find(r => r.value === role)?.description}
                </p>
              </div>

              {/* Personal Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message
                </label>
                <textarea
                  id="message"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Add a personal message..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be included in the invitation email
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Invitation
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Current Collaborators */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Current Collaborators ({collaborators.length})
              </h2>
            </div>

            {isLoadingCollaborators ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No collaborators yet</p>
                <p className="text-sm text-gray-400 mt-1">Invite someone to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {collaborators.map((collaborator) => {
                  const config = statusConfig[collaborator.status];
                  const StatusIcon = config.icon;

                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {(collaborator.collaborator_name || collaborator.collaborator_email)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {collaborator.collaborator_name || collaborator.collaborator_email}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">
                              {collaborator.role === 'mentor' ? 'Mentor' : 'Accountability Partner'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemove(collaborator.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove collaborator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">How collaborator invitations work</h3>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>- Collaborators will receive an email with your personal message</li>
                <li>- They'll need to create an account (or log in) to accept</li>
                <li>- Once accepted, they can view your plan and progress</li>
                <li>- Mentors can provide feedback and approve your plan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
