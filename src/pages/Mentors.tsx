// Mentoring Page
// Combined view for inviting mentors and viewing mentees

import { useState, useEffect, useRef, useCallback } from 'react';
import { UserPlus, Users, Calendar, Plus, Target, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getInvitations, getMentees } from '../services/mentor.service';
import type { MentorInvitation, Mentee } from '../services/mentor.service';
import { useCanvas } from '../hooks/useCanvas';
import { usePlans } from '../hooks/usePlan';
import { useSessions, useCreateSession } from '../hooks/useSession';
import { getPlanFeedbackLatest, getPlanComments, type MilestoneFeedback as FeedbackType, type MilestoneComment } from '../services/feedback.service';
import type { CreateSessionInput } from '../types/session.types';
import InviteMentor from '../components/mentor/InviteMentor';
import MentorList from '../components/mentor/MentorList';
import ReadOnlyOverlay from '../components/mentor/ReadOnlyOverlay';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import CanvasBusinessView from '../components/canvas/CanvasBusinessView';
import MilestoneGrid from '../components/plan/MilestoneGrid';
import SessionCard from '../components/session/SessionCard';
import ScheduleSessionModal from '../components/session/ScheduleSessionModal';
import { useToast } from '../components/shared/Toast';

export default function Mentors() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState<'invite' | 'mentees'>('invite');

  // Invite Mentors state
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const loadedRef = useRef(false);

  // My Mentees state
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [menteesLoading, setMenteesLoading] = useState(true);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [activeMenteeTab, setActiveMenteeTab] = useState<'canvas' | 'plan' | 'sessions'>('canvas');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Feedback and comments state
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackType>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, MilestoneComment[]>>({});

  // Mentee data hooks
  const { canvas, isLoading: canvasLoading } = useCanvas(selectedMenteeId || '');
  const { plans, isLoading: planLoading } = usePlans(selectedMenteeId || undefined);
  const plan = plans?.[0];
  const milestones = plan?.weekly_milestones || [];
  const { data: sessions, isLoading: sessionsLoading } = useSessions(user?.id);
  const createSession = useCreateSession(user?.id ?? '');

  // Load feedback and comments when plan changes
  useEffect(() => {
    if (plan?.id) {
      getPlanFeedbackLatest(plan.id).then(setFeedbackMap).catch(console.error);
      getPlanComments(plan.id).then(setCommentsMap).catch(console.error);
    }
  }, [plan?.id]);

  const loadInvitations = useCallback(async (showErrorToast = false) => {
    if (!user?.id) return;

    try {
      setError(null);
      const data = await getInvitations(user.id);
      setInvitations(data);
      loadedRef.current = true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
      console.error('Failed to load invitations:', err);
      setError(errorMessage);
      if (showErrorToast) {
        showToast('Failed to load invitations', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, showToast]);

  const loadMentees = useCallback(async () => {
    if (!user?.id) return;

    try {
      const menteesData = await getMentees(user.id);
      setMentees(menteesData);

      // Auto-select first mentee
      if (menteesData.length > 0 && !selectedMenteeId) {
        setSelectedMenteeId(menteesData[0].job_seeker_id);
      }
    } catch (error) {
      console.error('Failed to load mentees:', error);
    } finally {
      setMenteesLoading(false);
    }
  }, [user?.id, selectedMenteeId]);

  useEffect(() => {
    if (user?.id && !loadedRef.current) {
      loadInvitations();
    } else if (!user) {
      setLoading(false);
    }
  }, [user?.id, loadInvitations]);

  useEffect(() => {
    if (user?.id && activeMainTab === 'mentees') {
      loadMentees();
    }
  }, [user?.id, activeMainTab, loadMentees]);

  const handleInviteSuccess = () => {
    showToast('Invitation sent successfully!', 'success');
    loadedRef.current = false;
    loadInvitations(true);
  };

  const handleRetry = () => {
    setLoading(true);
    loadedRef.current = false;
    loadInvitations(true);
  };

  const selectedMentee = mentees.find((m) => m.job_seeker_id === selectedMenteeId);
  const menteeName = selectedMentee?.profiles.full_name || selectedMentee?.profiles.email;

  // Filter sessions for selected mentee
  const menteeSessions = sessions?.filter(
    (s) => s.attendee_id === selectedMenteeId || s.host_id === selectedMenteeId
  ) || [];

  const handleCreateSession = async (input: CreateSessionInput) => {
    if (!user?.id) {
      console.error('Cannot create session: user not authenticated');
      return;
    }
    await createSession.mutateAsync(input);
  };

  const canSchedule = Boolean(user?.id && selectedMenteeId);

  if (loading && activeMainTab === 'invite') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mentoring</h1>
          <p className="text-gray-600 mt-1">
            Invite mentors to support your journey, or view your mentees' progress
          </p>
        </div>

        {/* Main Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveMainTab('invite')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeMainTab === 'invite'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Invite Mentors
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('mentees')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeMainTab === 'mentees'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              My Mentees
            </button>
          </nav>
        </div>

        {/* Invite Mentors Tab Content */}
        {activeMainTab === 'invite' && (
          <div className="max-w-5xl">
            {/* Header with Invite Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Mentor Collaboration</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Invite mentors to view your Career Plans and 90-Day Plan
                </p>
              </div>
              <Button onClick={() => setShowInviteModal(true)}>
                Invite Mentor
              </Button>
            </div>

            {/* Info Card */}
            <Card className="mb-6 bg-blue-50 border border-blue-200">
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
                  <h3 className="font-medium text-blue-900">What mentors can see:</h3>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Your Career Plans - goals, strengths, and aspirations</li>
                    <li>Your 90-Day Plan - milestones and progress tracking</li>
                  </ul>
                  <p className="mt-2 text-sm text-blue-800">
                    Mentors have read-only access and cannot edit your data.
                  </p>
                </div>
              </div>
            </Card>

            {/* Invitations List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invited Mentors</h3>
              {error ? (
                <Card className="bg-red-50 border border-red-200">
                  <div className="text-center py-4">
                    <p className="text-red-700 mb-2">Error: {error}</p>
                    <Button variant="secondary" onClick={handleRetry}>
                      Retry
                    </Button>
                  </div>
                </Card>
              ) : (
                <MentorList invitations={invitations} onUpdate={() => { loadedRef.current = false; loadInvitations(true); }} />
              )}
            </div>

            {/* Invite Modal */}
            <InviteMentor
              open={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              onSuccess={handleInviteSuccess}
            />
          </div>
        )}

        {/* My Mentees Tab Content */}
        {activeMainTab === 'mentees' && (
          <>
            {menteesLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : mentees.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No Mentees Yet</h2>
                  <p className="text-gray-600">
                    You don't have any mentees yet. Wait for a job seeker to invite you as their mentor.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Read-only banner */}
                <ReadOnlyOverlay menteeName={menteeName} />

                <div className="flex flex-col lg:flex-row gap-6 mt-4">
                  {/* Left Sidebar - Mentee List */}
                  <div className="lg:w-72 flex-shrink-0">
                    <Card className="sticky top-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-600" />
                        My Mentees
                      </h2>
                      <div className="space-y-2">
                        {mentees.map((mentee) => {
                          const isSelected = mentee.job_seeker_id === selectedMenteeId;
                          const name = mentee.profiles.full_name || mentee.profiles.email;
                          return (
                            <button
                              key={mentee.job_seeker_id}
                              onClick={() => setSelectedMenteeId(mentee.job_seeker_id)}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-primary-50 border-2 border-primary-500 text-primary-700'
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  isSelected ? 'bg-primary-600' : 'bg-gray-400'
                                }`}>
                                  {name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-medium truncate ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                                    {name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {mentee.profiles.email}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Right Content Area */}
                  <div className="flex-1 min-w-0">
                    {/* Selected Mentee Header */}
                    {selectedMentee && (
                      <Card className="mb-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                              {menteeName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">{menteeName}</h2>
                              <p className="text-sm text-gray-600">{selectedMentee.profiles.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowScheduleModal(true)}
                            disabled={!canSchedule}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Calendar className="w-4 h-4" />
                            Schedule Session
                          </button>
                        </div>
                      </Card>
                    )}

                    {/* Mentee Content Tab Navigation */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-6">
                        <button
                          type="button"
                          onClick={() => setActiveMenteeTab('canvas')}
                          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeMenteeTab === 'canvas'
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Target className="w-4 h-4" />
                          Career Canvas
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenteeTab('plan')}
                          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeMenteeTab === 'plan'
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          90-Day Plan
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenteeTab('sessions')}
                          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeMenteeTab === 'sessions'
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          Sessions
                        </button>
                      </nav>
                    </div>

                    {/* Canvas Tab */}
                    {activeMenteeTab === 'canvas' && (
                      <>
                        {canvasLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <LoadingSpinner />
                          </div>
                        ) : canvas ? (
                          <CanvasBusinessView
                            canvas={canvas}
                            canvasName={canvas.target_role || canvas.name || 'Career Canvas'}
                            linkedPlanId={canvas.linked_plan_id}
                          />
                        ) : (
                          <Card>
                            <p className="text-center text-gray-500 py-8">No career canvas created yet</p>
                          </Card>
                        )}
                      </>
                    )}

                    {/* Plan Tab */}
                    {activeMenteeTab === 'plan' && (
                      <>
                        {planLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <LoadingSpinner />
                          </div>
                        ) : plan ? (
                          <div className="space-y-6">
                            {/* Plan Header */}
                            <Card>
                              <h2 className="text-xl font-semibold mb-2">{plan.title}</h2>
                              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                                <span>Start: {new Date(plan.start_date).toLocaleDateString()}</span>
                                <span>End: {new Date(plan.end_date).toLocaleDateString()}</span>
                              </div>
                            </Card>

                            {/* Milestones Grid with Feedback */}
                            {milestones && milestones.length > 0 ? (
                              <MilestoneGrid
                                milestones={milestones}
                                planStartDate={plan.start_date}
                                feedbackMap={feedbackMap}
                                commentsMap={commentsMap}
                                isMentor={true}
                                showFeedback={true}
                                currentUserId={user?.id}
                                onFeedbackSaved={(milestoneId, feedback) => {
                                  setFeedbackMap(prev => ({
                                    ...prev,
                                    [milestoneId]: feedback
                                  }));
                                }}
                                onCommentAdded={(milestoneId, comment) => {
                                  setCommentsMap(prev => ({
                                    ...prev,
                                    [milestoneId]: [...(prev[milestoneId] || []), comment]
                                  }));
                                }}
                                onCommentDeleted={(milestoneId, commentId) => {
                                  setCommentsMap(prev => ({
                                    ...prev,
                                    [milestoneId]: (prev[milestoneId] || []).filter(c => c.id !== commentId)
                                  }));
                                }}
                              />
                            ) : (
                              <Card>
                                <p className="text-center text-gray-500 py-8">No milestones created yet</p>
                              </Card>
                            )}
                          </div>
                        ) : (
                          <Card>
                            <p className="text-center text-gray-500 py-8">No plan created yet</p>
                          </Card>
                        )}
                      </>
                    )}

                    {/* Sessions Tab */}
                    {activeMenteeTab === 'sessions' && (
                      <>
                        {/* Header with Schedule Button */}
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">Sessions with {menteeName}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                              Schedule and manage mentorship sessions
                            </p>
                          </div>
                          {canSchedule && (
                            <button
                              onClick={() => setShowScheduleModal(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Schedule Session
                            </button>
                          )}
                        </div>

                        {sessionsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <LoadingSpinner />
                          </div>
                        ) : menteeSessions.length > 0 ? (
                          <div className="space-y-4">
                            {menteeSessions.map((session) => (
                              <SessionCard
                                key={session.id}
                                session={session}
                                currentUserId={user?.id || ''}
                              />
                            ))}
                          </div>
                        ) : (
                          <Card>
                            <div className="text-center py-12">
                              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                              <p className="text-gray-500 mb-4">
                                Schedule a session with {menteeName} to get started.
                              </p>
                              {canSchedule && (
                                <button
                                  onClick={() => setShowScheduleModal(true)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Schedule First Session
                                </button>
                              )}
                            </div>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Schedule Session Modal */}
                {selectedMenteeId && menteeName && (
                  <ScheduleSessionModal
                    isOpen={showScheduleModal}
                    onClose={() => setShowScheduleModal(false)}
                    onSubmit={handleCreateSession}
                    attendeeId={selectedMenteeId}
                    attendeeName={menteeName}
                    planId={plan?.id}
                    planTitle={plan?.title}
                    isLoading={createSession.isPending}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
