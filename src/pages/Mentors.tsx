// Mentors Page
// Manage mentor invitations and access

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getInvitations } from '../services/mentor.service';
import type { MentorInvitation } from '../services/mentor.service';
import InviteMentor from '../components/mentor/InviteMentor';
import MentorList from '../components/mentor/MentorList';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';

export default function Mentors() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState<MentorInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const loadedRef = useRef(false);

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

  useEffect(() => {
    if (user?.id && !loadedRef.current) {
      loadInvitations();
    } else if (!user) {
      setLoading(false);
    }
  }, [user?.id, loadInvitations]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Mentor Collaboration</h1>
            <Button onClick={() => setShowInviteModal(true)}>
              Invite Mentor
            </Button>
          </div>
          <p className="text-gray-600">
            Invite mentors to view your Career Plans and 90-Day Plan. They'll have read-only access
            to support your career journey.
          </p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invited Mentors</h2>
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
    </div>
  );
}
