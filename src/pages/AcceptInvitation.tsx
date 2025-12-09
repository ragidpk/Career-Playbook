// AcceptInvitation Page
// Allows mentors to accept invitations via email link

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { acceptInvitation } from '../services/mentor.service';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const invitationId = searchParams.get('token');

  useEffect(() => {
    // If user is not logged in, redirect to login with return URL
    if (!user && invitationId) {
      navigate(`/login?redirect=/accept-invitation?token=${invitationId}`);
    }
  }, [user, invitationId, navigate]);

  const handleAccept = async () => {
    if (!invitationId) {
      setError('Invalid invitation link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await acceptInvitation(invitationId);
      setSuccess(true);

      // Redirect to mentor view after 2 seconds
      setTimeout(() => {
        navigate('/mentor-view');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!invitationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-red-500 mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-green-500 mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600 mb-4">
              You can now view your mentee's career data.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to mentor dashboard...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-primary-500 mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mentor Invitation</h2>
          <p className="text-gray-600 mb-6">
            You've been invited to become a career mentor. By accepting, you'll have read-only
            access to view your mentee's Career Canvas and 90-Day Plan.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              className="flex-1"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              Accept Invitation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
