import { useState } from 'react';
import { X, Calendar, Clock, Video, Plus, Trash2 } from 'lucide-react';
import { format, addHours, addDays } from 'date-fns';
import type { CreateSessionInput, ProposedTime, MeetingProvider, SessionType } from '../../types/session.types';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSessionInput) => Promise<void>;
  attendeeId: string;
  attendeeName: string;
  planId?: string;
  planTitle?: string;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
];

// Meeting providers - used for auto-detection from URLs
// Phase 4 will add auto-generation of meeting links

export default function ScheduleSessionModal({
  isOpen,
  onClose,
  onSubmit,
  attendeeId,
  attendeeName,
  planId,
  planTitle,
  isLoading = false,
}: ScheduleSessionModalProps) {
  const [title, setTitle] = useState(`Session with ${attendeeName}`);
  const [description, setDescription] = useState('');
  const [sessionType] = useState<SessionType>('one_time'); // Recurrence disabled until Phase 4
  const [duration, setDuration] = useState(60);
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [proposedTimes, setProposedTimes] = useState<ProposedTime[]>([]);
  const [error, setError] = useState<string | null>(null);

  // For adding new time slots
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState('10:00');

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleAddTime = () => {
    const start = new Date(`${newDate}T${newTime}:00`);
    const end = addHours(start, duration / 60);

    const newSlot: ProposedTime = {
      start: start.toISOString(),
      end: end.toISOString(),
    };

    // Check for duplicates
    const isDuplicate = proposedTimes.some(
      (t) => t.start === newSlot.start
    );

    if (isDuplicate) {
      setError('This time slot is already added');
      return;
    }

    setProposedTimes([...proposedTimes, newSlot]);
    setError(null);

    // Suggest next time slot (same day, 2 hours later or next day)
    const nextTime = addHours(start, 2);
    if (nextTime.getHours() < 18) {
      setNewTime(format(nextTime, 'HH:mm'));
    } else {
      setNewDate(format(addDays(start, 1), 'yyyy-MM-dd'));
      setNewTime('10:00');
    }
  };

  const handleRemoveTime = (index: number) => {
    setProposedTimes(proposedTimes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a session title');
      return;
    }

    if (proposedTimes.length === 0) {
      setError('Please propose at least one time slot');
      return;
    }

    try {
      await onSubmit({
        plan_id: planId,
        attendee_id: attendeeId,
        title: title.trim(),
        description: description.trim() || undefined,
        session_type: sessionType,
        proposed_times: proposedTimes,
        duration_minutes: duration,
        timezone,
        meeting_provider: meetingProvider || undefined,
        meeting_link: meetingLink.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900">
              Schedule Session
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              with {attendeeName}
              {planTitle && <span className="text-primary-600"> • {planTitle}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Career Planning Discussion"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What would you like to discuss?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Link - simplified for MVP (no auto-generation yet) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Video className="inline w-4 h-4 mr-1" />
              Meeting Link (optional)
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => {
                setMeetingLink(e.target.value);
                // Auto-detect provider from URL
                if (e.target.value.includes('meet.google.com')) {
                  setMeetingProvider('google_meet');
                } else if (e.target.value.includes('zoom.us')) {
                  setMeetingProvider('zoom');
                } else if (e.target.value) {
                  setMeetingProvider('manual');
                } else {
                  setMeetingProvider(null);
                }
              }}
              placeholder="https://meet.google.com/... or https://zoom.us/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Create your meeting in Google Meet, Zoom, or Teams and paste the link here
            </p>
          </div>

          {/* Propose Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Propose Times (select 2-3 options)
            </label>

            {/* Existing proposed times */}
            {proposedTimes.length > 0 && (
              <div className="mb-3 space-y-2">
                {proposedTimes.map((time, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-600" />
                      <span className="text-sm font-medium text-primary-900">
                        {format(new Date(time.start), 'EEE, MMM d')} at{' '}
                        {format(new Date(time.start), 'h:mm a')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveTime(index)}
                      className="p-1 text-primary-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new time */}
            <div className="flex gap-2">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <button
                onClick={handleAddTime}
                className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Timezone: {timezone}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || proposedTimes.length === 0}
            className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
