import {
  Star,
  ExternalLink,
  MapPin,
  Calendar,
  Briefcase,
  Pencil,
  Trash2,
  DollarSign,
} from 'lucide-react';
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

export default function JobCard({
  job,
  onEdit,
  onDelete,
  onToggleFavorite,
}: JobCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isDeadlineClose =
    job.deadline &&
    new Date(job.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover p-5 transition-smooth">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-display text-lg font-semibold text-gray-900 truncate flex-1">
              {job.title}
            </h3>
            <button
              type="button"
              onClick={() => onToggleFavorite(job)}
              className={`flex-shrink-0 p-1.5 rounded-xl transition-smooth ${
                job.is_favorite
                  ? 'text-warning-500 bg-warning-50'
                  : 'text-gray-300 hover:text-warning-500 hover:bg-warning-50'
              }`}
              aria-label={
                job.is_favorite ? 'Remove from favorites' : 'Add to favorites'
              }
            >
              <Star
                className={`w-5 h-5 ${job.is_favorite ? 'fill-current' : ''}`}
              />
            </button>
          </div>
          <p className="text-gray-700 font-medium mt-1">{job.company_name}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-smooth"
            aria-label="Edit job"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(job)}
            className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-smooth"
            aria-label="Delete job"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <StatusBadge status={job.application_status} size="sm" />
        {job.source && (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-600 bg-gray-100 rounded-pill font-medium">
            {SOURCE_LABELS[job.source]}
          </span>
        )}
        {job.job_type && (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-600 bg-gray-100 rounded-pill font-medium">
            <Briefcase className="w-3 h-3 mr-1" />
            {JOB_TYPE_LABELS[job.job_type]}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-500 mb-4">
        {job.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{job.location}</span>
          </div>
        )}
        {job.salary_range && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>{job.salary_range}</span>
          </div>
        )}
        {job.applied_date && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Applied: {formatDate(job.applied_date)}</span>
          </div>
        )}
        {job.deadline && (
          <div
            className={`flex items-center gap-2 ${isDeadlineClose ? 'text-error-600 font-medium' : ''}`}
          >
            <Calendar
              className={`w-4 h-4 ${isDeadlineClose ? 'text-error-500' : 'text-gray-400'}`}
            />
            <span>Deadline: {formatDate(job.deadline)}</span>
            {isDeadlineClose && (
              <span className="text-xs bg-error-50 text-error-600 px-2 py-0.5 rounded-pill font-semibold">
                Soon!
              </span>
            )}
          </div>
        )}
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {job.description}
        </p>
      )}

      {job.notes && (
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-600 line-clamp-2">
            <span className="font-semibold text-gray-700">Notes:</span>{' '}
            {job.notes}
          </p>
        </div>
      )}

      {job.job_url && (
        <a
          href={job.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 font-medium transition-smooth"
        >
          View Job Posting
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
