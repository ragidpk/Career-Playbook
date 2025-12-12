import { Calendar, Users, Clock } from 'lucide-react';
import type { Interview } from '../../services/interview.service';

interface InterviewCardProps {
  interview: Interview;
  onEdit: (interview: Interview) => void;
  onDelete: (interview: Interview) => void;
}

const INTERVIEW_TYPE_LABELS = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  final: 'Final Round',
  offer: 'Offer Discussion',
  other: 'Other',
};

const INTERVIEW_TYPE_COLORS = {
  phone_screen: 'bg-blue-100 text-blue-800',
  technical: 'bg-purple-100 text-purple-800',
  behavioral: 'bg-green-100 text-green-800',
  final: 'bg-orange-100 text-orange-800',
  offer: 'bg-emerald-100 text-emerald-800',
  other: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rescheduled: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function InterviewCard({ interview, onEdit, onDelete }: InterviewCardProps) {
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const scheduledDateTime = formatDateTime(interview.scheduled_at);

  return (
    <div className={`bg-white rounded-lg shadow border-2 p-4 hover:shadow-md transition-shadow ${STATUS_COLORS[interview.status]}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {interview.company_name}
          </h3>
          <p className="text-sm text-gray-600 truncate">{interview.position}</p>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            type="button"
            onClick={() => onEdit(interview)}
            className="p-1 text-gray-500 hover:text-primary-500 transition-colors"
            aria-label="Edit interview"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(interview)}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Delete interview"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${INTERVIEW_TYPE_COLORS[interview.interview_type]}`}>
          {INTERVIEW_TYPE_LABELS[interview.interview_type]}
        </span>
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full capitalize`}>
          {interview.status}
        </span>
      </div>

      {scheduledDateTime && (
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{scheduledDateTime.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{scheduledDateTime.time}</span>
          </div>
        </div>
      )}

      {interview.interviewer_names && interview.interviewer_names.length > 0 && (
        <div className="flex items-start gap-1 mb-3 text-sm text-gray-600">
          <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{interview.interviewer_names.join(', ')}</span>
        </div>
      )}

      {interview.prep_notes && (
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Prep Notes:</p>
          <p className="text-sm text-gray-700 line-clamp-2">{interview.prep_notes}</p>
        </div>
      )}

      {interview.feedback && (
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-500 mb-1">Feedback:</p>
          <p className="text-sm text-gray-700 line-clamp-2">{interview.feedback}</p>
        </div>
      )}

      {interview.follow_up_date && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Follow-up: {new Date(interview.follow_up_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}
