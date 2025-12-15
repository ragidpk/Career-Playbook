import { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  Check,
  X,
  MoreVertical,
  ExternalLink,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import type { SessionWithProfiles, SessionStatus, ProposedTime } from '../../types/session.types';

interface SessionCardProps {
  session: SessionWithProfiles;
  currentUserId: string;
  onConfirm?: (sessionId: string, selectedTime: ProposedTime) => void;
  onCancel?: (sessionId: string) => void;
  onComplete?: (sessionId: string) => void;
  onNoShow?: (sessionId: string) => void;
  onViewDetails?: (sessionId: string) => void;
  isCompact?: boolean;
}

const STATUS_STYLES: Record<SessionStatus, { bg: string; text: string; label: string }> = {
  proposed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Proposed' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
  no_show: { bg: 'bg-red-100', text: 'text-red-800', label: 'No Show' },
};

export default function SessionCard({
  session,
  currentUserId,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  onViewDetails,
  isCompact = false,
}: SessionCardProps) {
  const [showTimeSelect, setShowTimeSelect] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isHost = session.host_id === currentUserId;
  const isAttendee = session.attendee_id === currentUserId;
  const otherPerson = isHost ? session.attendee : session.host;
  const statusStyle = STATUS_STYLES[session.status];

  const isUpcoming =
    session.scheduled_start &&
    !isPast(new Date(session.scheduled_start)) &&
    session.status === 'confirmed';

  const canConfirm = session.status === 'proposed' && isAttendee;
  const canCancel = ['proposed', 'confirmed'].includes(session.status);
  const canComplete =
    session.status === 'confirmed' &&
    session.scheduled_start &&
    isPast(new Date(session.scheduled_start));

  const handleTimeSelect = (time: ProposedTime) => {
    if (onConfirm) {
      onConfirm(session.id, time);
    }
    setShowTimeSelect(false);
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{session.title}</p>
          <p className="text-sm text-gray-500">
            with {otherPerson?.full_name || 'Unknown'}
            {session.scheduled_start && (
              <> • {format(new Date(session.scheduled_start), 'MMM d, h:mm a')}</>
            )}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{session.title}</h3>
              <p className="text-sm text-gray-500">
                with {otherPerson?.full_name || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
            {(canCancel || canComplete) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {canComplete && onComplete && (
                      <button
                        onClick={() => {
                          onComplete(session.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </button>
                    )}
                    {canComplete && onNoShow && (
                      <button
                        onClick={() => {
                          onNoShow(session.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Mark No Show
                      </button>
                    )}
                    {canCancel && onCancel && (
                      <button
                        onClick={() => {
                          onCancel(session.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel Session
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Scheduled Time */}
        {session.scheduled_start ? (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              {format(new Date(session.scheduled_start), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        ) : session.proposed_times && session.proposed_times.length > 0 ? (
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-700">
              {session.proposed_times.length} time{session.proposed_times.length > 1 ? 's' : ''} proposed
            </span>
          </div>
        ) : null}

        {session.scheduled_start && (
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">
              {format(new Date(session.scheduled_start), 'h:mm a')} -{' '}
              {session.scheduled_end && format(new Date(session.scheduled_end), 'h:mm a')}
              <span className="text-gray-400 ml-2">
                ({session.duration_minutes} min)
              </span>
            </span>
          </div>
        )}

        {/* Meeting Link */}
        {session.meeting_link && isUpcoming && (
          <a
            href={session.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-primary-600 hover:text-primary-700"
          >
            <Video className="w-4 h-4" />
            <span>Join Meeting</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Description */}
        {session.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{session.description}</p>
        )}

        {/* Time Until Session */}
        {isUpcoming && session.scheduled_start && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-primary-600 font-medium">
              Starts {formatDistanceToNow(new Date(session.scheduled_start), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>

      {/* Actions for Proposed Sessions */}
      {canConfirm && session.proposed_times && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-100">
          {showTimeSelect ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Select a time:
              </p>
              {session.proposed_times.map((time, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(time)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-left"
                >
                  <span className="font-medium text-gray-900">
                    {format(new Date(time.start), 'EEEE, MMM d')}
                  </span>
                  <span className="text-gray-500 ml-2">
                    at {format(new Date(time.start), 'h:mm a')}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowTimeSelect(false)}
                className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowTimeSelect(true)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Accept & Choose Time
              </button>
              {onCancel && (
                <button
                  onClick={() => onCancel(session.id)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes for Completed Sessions */}
      {session.status === 'completed' && session.session_notes && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-600 line-clamp-2">{session.session_notes}</p>
          </div>
        </div>
      )}

      {/* View Details Button */}
      {onViewDetails && (
        <button
          onClick={() => onViewDetails(session.id)}
          className="w-full p-3 text-sm text-primary-600 hover:bg-primary-50 border-t border-gray-100 transition-colors"
        >
          View Details
        </button>
      )}
    </div>
  );
}
