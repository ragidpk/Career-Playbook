import { useState } from 'react';
import { Calendar, Clock, History, Video, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  useSessions,
  useUpcomingSessions,
  usePastSessions,
  useSessionStats,
  useConfirmSession,
  useCancelSession,
  useCompleteSession,
  useMarkNoShow,
} from '../hooks/useSession';
import SessionCard from '../components/session/SessionCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import type { ProposedTime, SessionStatus } from '../types/session.types';

type TabType = 'upcoming' | 'past' | 'all';

export default function Sessions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [statusFilter] = useState<SessionStatus[]>([]);

  // Queries
  const { data: upcomingSessions, isLoading: loadingUpcoming } = useUpcomingSessions(
    user?.id,
    10
  );
  const { data: pastSessions, isLoading: loadingPast } = usePastSessions(user?.id, 20);
  const { data: allSessions, isLoading: loadingAll } = useSessions(user?.id, {
    status: statusFilter.length > 0 ? statusFilter : undefined,
  });
  const { data: stats } = useSessionStats(user?.id);

  // Mutations
  const confirmSession = useConfirmSession();
  const cancelSession = useCancelSession();
  const completeSession = useCompleteSession();
  const markNoShow = useMarkNoShow();

  const handleConfirm = async (sessionId: string, selectedTime: ProposedTime) => {
    try {
      await confirmSession.mutateAsync({
        session_id: sessionId,
        selected_time: selectedTime,
      });
    } catch (error) {
      console.error('Failed to confirm session:', error);
    }
  };

  const handleCancel = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;
    try {
      await cancelSession.mutateAsync({ session_id: sessionId });
    } catch (error) {
      console.error('Failed to cancel session:', error);
    }
  };

  const handleComplete = async (sessionId: string) => {
    try {
      await completeSession.mutateAsync({ session_id: sessionId });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleNoShow = async (sessionId: string) => {
    if (!confirm('Mark this session as no-show?')) return;
    try {
      await markNoShow.mutateAsync(sessionId);
    } catch (error) {
      console.error('Failed to mark no-show:', error);
    }
  };

  const isLoading =
    (activeTab === 'upcoming' && loadingUpcoming) ||
    (activeTab === 'past' && loadingPast) ||
    (activeTab === 'all' && loadingAll);

  const sessions =
    activeTab === 'upcoming'
      ? upcomingSessions
      : activeTab === 'past'
        ? pastSessions
        : allSessions;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Sessions
          </h1>
          <p className="text-gray-600">
            Manage your mentorship and accountability sessions
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcoming}</p>
                  <p className="text-sm text-gray-500">Upcoming</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                  <p className="text-sm text-gray-500">Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {[
            { id: 'upcoming' as TabType, label: 'Upcoming', icon: Clock },
            { id: 'past' as TabType, label: 'Past', icon: History },
            { id: 'all' as TabType, label: 'All Sessions', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                currentUserId={user?.id || ''}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onComplete={handleComplete}
                onNoShow={handleNoShow}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'upcoming'
                ? 'No upcoming sessions'
                : activeTab === 'past'
                  ? 'No past sessions'
                  : 'No sessions yet'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {activeTab === 'upcoming'
                ? 'When you schedule sessions with mentors or accountability partners, they will appear here.'
                : activeTab === 'past'
                  ? 'Your completed and cancelled sessions will appear here.'
                  : 'Start by inviting a mentor or accountability partner to your 12 Weeks Plan.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
