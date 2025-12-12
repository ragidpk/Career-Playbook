import { useMemo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import type { Interview } from '../../services/interview.service';

interface InterviewCalendarProps {
  interviews: Interview[];
  onEdit: (interview: Interview) => void;
}

const INTERVIEW_TYPE_LABELS = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  final: 'Final Round',
  offer: 'Offer Discussion',
  other: 'Other',
};

export default function InterviewCalendar({ interviews, onEdit }: InterviewCalendarProps) {
  const scheduledInterviews = useMemo(() => {
    return interviews
      .filter(i => i.scheduled_at && i.status === 'scheduled')
      .sort((a, b) => {
        const dateA = new Date(a.scheduled_at!).getTime();
        const dateB = new Date(b.scheduled_at!).getTime();
        return dateA - dateB;
      });
  }, [interviews]);

  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: Interview[] } = {};

    scheduledInterviews.forEach(interview => {
      const date = new Date(interview.scheduled_at!);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(interview);
    });

    return groups;
  }, [scheduledInterviews]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (scheduledInterviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No scheduled interviews</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your upcoming interviews will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dayInterviews]) => (
        <div key={date} className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {date}
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dayInterviews.map(interview => (
              <div
                key={interview.id}
                onClick={() => onEdit(interview)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {formatTime(interview.scheduled_at!)}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {INTERVIEW_TYPE_LABELS[interview.interview_type]}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900">
                      {interview.company_name}
                    </h4>
                    <p className="text-sm text-gray-600">{interview.position}</p>
                    {interview.interviewer_names && interview.interviewer_names.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        With: {interview.interviewer_names.join(', ')}
                      </p>
                    )}
                    {interview.prep_notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {interview.prep_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
