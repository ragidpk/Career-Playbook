// InviteMentor Component
// Modal for inviting mentors via email with optional personal message

import { useState } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Textarea from '../shared/Textarea';
import Button from '../shared/Button';
import { inviteMentor } from '../../services/mentor.service';

interface InviteMentorProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteMentor({ open, onClose, onSuccess }: InviteMentorProps) {
  const [mentorEmail, setMentorEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mentorEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await inviteMentor(mentorEmail, personalMessage || undefined);

      // Reset form and close modal
      setMentorEmail('');
      setPersonalMessage('');
      onClose();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMentorEmail('');
      setPersonalMessage('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Invite Mentor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="mentor-email"
          type="email"
          label="Mentor's Email"
          placeholder="mentor@example.com"
          value={mentorEmail}
          onChange={(e) => setMentorEmail(e.target.value)}
          required
          disabled={loading}
          error={error}
          helperText="Your mentor will receive an invitation email with a link to accept"
        />

        <Textarea
          id="personal-message"
          label="Personal Message (Optional)"
          placeholder="Hi! I'd love to have you as my mentor on Career Playbook..."
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          rows={4}
          disabled={loading}
          helperText="Add a personal note to your invitation (optional)"
        />

        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !mentorEmail}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
