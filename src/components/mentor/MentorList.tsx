// MentorList Component
// List of invited mentors with status badges and actions

import { useState } from 'react';
import type { MentorInvitation } from '../../services/mentor.service';
import { resendInvitation, revokeAccess } from '../../services/mentor.service';
import Button from '../shared/Button';
import Card from '../shared/Card';

interface MentorListProps {
  invitations: MentorInvitation[];
  onUpdate: () => void;
}

export default function MentorList({ invitations, onUpdate }: MentorListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'accepted':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Accepted</span>;
      case 'declined':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Declined</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const handleResend = async (invitationId: string) => {
    setError('');
    setLoadingId(invitationId);

    try {
      await resendInvitation(invitationId);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevoke = async (invitation: MentorInvitation) => {
    if (!invitation.mentor_id) return;

    const confirmed = window.confirm(
      `Are you sure you want to revoke ${invitation.mentor_email}'s access? They will no longer be able to view your career data.`
    );

    if (!confirmed) return;

    setError('');
    setLoadingId(invitation.id);

    try {
      await revokeAccess(invitation.job_seeker_id, invitation.mentor_id);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p>No mentors invited yet</p>
          <p className="text-sm mt-2">Click "Invite Mentor" to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {invitation.mentor_email}
                </h3>
                {getStatusBadge(invitation.status)}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                <p>Invited: {formatDate(invitation.invited_at)}</p>
                {invitation.accepted_at && (
                  <p>Accepted: {formatDate(invitation.accepted_at)}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              {invitation.status === 'pending' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleResend(invitation.id)}
                  loading={loadingId === invitation.id}
                  disabled={loadingId !== null}
                >
                  Resend
                </Button>
              )}

              {invitation.status === 'accepted' && invitation.mentor_id && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRevoke(invitation)}
                  loading={loadingId === invitation.id}
                  disabled={loadingId !== null}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  Revoke Access
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
