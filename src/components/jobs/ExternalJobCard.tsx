// External Job Card
// Displays a job from the discovery layer with save/hide/track actions

import { Building2, MapPin, Clock, DollarSign, ExternalLink, Bookmark, EyeOff, Briefcase, Trash2 } from 'lucide-react';
import Button from '../shared/Button';
import type { ExternalJob, ExternalJobWithState, JobItemState } from '../../types/externalJobs.types';

interface ExternalJobCardProps {
  job: ExternalJob | ExternalJobWithState;
  userState?: JobItemState | null;
  crmApplicationId?: string | null;
  onSave?: () => void;
  onUnsave?: () => void;
  onHide?: () => void;
  onTrackInCrm?: () => void;
  onViewInCrm?: () => void;
  isSaving?: boolean;
  isUnsaving?: boolean;
  isHiding?: boolean;
  isTracking?: boolean;
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string
): string | null {
  if (!min && !max) return null;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) {
    return `From ${formatter.format(min)}`;
  }
  if (max) {
    return `Up to ${formatter.format(max)}`;
  }
  return null;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function getLocationTypeBadge(locationType: string | null) {
  if (!locationType) return null;

  const styles: Record<string, string> = {
    remote: 'bg-green-100 text-green-800',
    hybrid: 'bg-blue-100 text-blue-800',
    onsite: 'bg-orange-100 text-orange-800',
  };

  const labels: Record<string, string> = {
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        styles[locationType] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {labels[locationType] || locationType}
    </span>
  );
}

export default function ExternalJobCard({
  job,
  userState,
  crmApplicationId,
  onSave,
  onUnsave,
  onHide,
  onTrackInCrm,
  onViewInCrm,
  isSaving,
  isUnsaving,
  isHiding,
  isTracking,
}: ExternalJobCardProps) {
  const state = userState || (job as ExternalJobWithState).user_state;
  const appId = crmApplicationId || (job as ExternalJobWithState).crm_application_id;
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const postedDate = formatDate(job.posted_at);

  const isSaved = state === 'saved';
  const isTracked = !!appId;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-gray-600">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.company_name}</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 ml-2">
          {isTracked && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              <Briefcase className="h-3 w-3 mr-1" />
              In CRM
            </span>
          )}
          {isSaved && !isTracked && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
              <Bookmark className="h-3 w-3 mr-1" />
              Saved
            </span>
          )}
          {getLocationTypeBadge(job.location_type)}
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        {job.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
        )}
        {salary && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>{salary}</span>
          </div>
        )}
        {postedDate && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{postedDate}</span>
          </div>
        )}
      </div>

      {/* Description snippet */}
      {job.description_snippet && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{job.description_snippet}</p>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Apply button */}
        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Apply
          </a>
        )}

        {/* Save button (when not saved) */}
        {!isTracked && !isSaved && onSave && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            loading={isSaving}
          >
            <Bookmark className="h-4 w-4 mr-1" />
            Save
          </Button>
        )}

        {/* Remove from saved button (when saved) */}
        {isSaved && onUnsave && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onUnsave}
            loading={isUnsaving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}

        {/* Hide button */}
        {!isTracked && !isSaved && onHide && (
          <Button variant="secondary" size="sm" onClick={onHide} loading={isHiding}>
            <EyeOff className="h-4 w-4 mr-1" />
            Hide
          </Button>
        )}

        {/* Track in CRM button */}
        {!isTracked && onTrackInCrm && (
          <Button variant="primary" size="sm" onClick={onTrackInCrm} loading={isTracking}>
            <Briefcase className="h-4 w-4 mr-1" />
            Track in CRM
          </Button>
        )}

        {/* View in CRM button */}
        {isTracked && onViewInCrm && (
          <Button variant="secondary" size="sm" onClick={onViewInCrm}>
            <Briefcase className="h-4 w-4 mr-1" />
            View in CRM
          </Button>
        )}
      </div>

      {/* Source tag */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Source: {job.provider === 'jooble' ? 'Jooble' : job.provider === 'manual_url' ? 'Manual Import' : job.provider}
        </span>
      </div>
    </div>
  );
}
