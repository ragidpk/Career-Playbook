import { Star, ExternalLink, MapPin, Calendar, Briefcase } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { JobListing } from '../../services/job.service';

interface JobCardProps {
  job: JobListing;
  onEdit: (job: JobListing) => void;
  onDelete: (job: JobListing) => void;
  onToggleFavorite: (job: JobListing) => void;
}

const JOB_TYPE_LABELS: Record<NonNullable<JobListing['job_type']>, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
};

const SOURCE_LABELS: Record<NonNullable<JobListing['source']>, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
  company_site: 'Company Site',
  referral: 'Referral',
  other: 'Other',
};

export default function JobCard({ job, onEdit, onDelete, onToggleFavorite }: JobCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDeadlineClose = job.deadline && new Date(job.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
              {job.title}
            </h3>
            <button
              type="button"
              onClick={() => onToggleFavorite(job)}
              className={`flex-shrink-0 transition-colors ${
                job.is_favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
              }`}
              aria-label={job.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-5 h-5 ${job.is_favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          <p className="text-gray-700 font-medium mt-1">{job.company_name}</p>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="p-1 text-gray-500 hover:text-primary-500 transition-colors"
            aria-label="Edit job"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            onClick={() => onDelete(job)}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Delete job"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <StatusBadge status={job.application_status} size="sm" />
        {job.source && (
          <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-600 bg-gray-50 rounded-full">
            {SOURCE_LABELS[job.source]}
          </span>
        )}
        {job.job_type && (
          <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-600 bg-gray-50 rounded-full">
            <Briefcase className="w-3 h-3 mr-1" />
            {JOB_TYPE_LABELS[job.job_type]}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-3">
        {job.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
          </div>
        )}
        {job.salary_range && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{job.salary_range}</span>
          </div>
        )}
        {job.applied_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Applied: {formatDate(job.applied_date)}</span>
          </div>
        )}
        {job.deadline && (
          <div className={`flex items-center gap-1 ${isDeadlineClose ? 'text-red-600 font-medium' : ''}`}>
            <Calendar className="w-4 h-4" />
            <span>Deadline: {formatDate(job.deadline)}</span>
            {isDeadlineClose && <span className="text-xs ml-1">(Soon!)</span>}
          </div>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {job.description}
        </p>
      )}

      {job.notes && (
        <div className="bg-gray-50 rounded p-2 mb-3">
          <p className="text-xs text-gray-600 line-clamp-2">
            <span className="font-medium">Notes:</span> {job.notes}
          </p>
        </div>
      )}

      {job.job_url && (
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 hover:underline"
        >
          View Job Posting
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
