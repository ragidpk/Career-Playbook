import { Star, MapPin, Briefcase, User, Calendar, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { STATUS_OPTIONS } from './StatusFilter';
import type { Company } from '../../services/company.service';

interface CompanyCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onToggleFavorite?: (company: Company) => void;
}

const PRIORITY_COLORS = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-blue-100 text-blue-600',
  3: 'bg-yellow-100 text-yellow-600',
  4: 'bg-orange-100 text-orange-600',
  5: 'bg-red-100 text-red-600',
};

const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Med-Low',
  3: 'Medium',
  4: 'Med-High',
  5: 'High',
};

export default function CompanyCard({ company, onEdit, onDelete, onToggleFavorite }: CompanyCardProps) {
  const statusOption = STATUS_OPTIONS.find((opt) => opt.value === company.status);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isFollowupOverdue = () => {
    if (!company.next_followup_date) return false;
    const today = new Date().toISOString().split('T')[0];
    return company.next_followup_date < today;
  };

  const isFollowupSoon = () => {
    if (!company.next_followup_date) return false;
    const today = new Date();
    const followup = new Date(company.next_followup_date);
    const diffDays = Math.ceil((followup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      {/* Header with company name and actions */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {company.name}
              </h3>
              {company.is_favorite && (
                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>
            {company.job_title && (
              <p className="text-sm text-primary-600 font-medium truncate mt-0.5">
                {company.job_title}
              </p>
            )}
            {company.location && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{company.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(company)}
                className={`p-1.5 rounded transition-colors ${
                  company.is_favorite
                    ? 'text-yellow-500 hover:bg-yellow-50'
                    : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
                }`}
                title={company.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${company.is_favorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(company)}
              className="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded transition-colors"
              aria-label="Edit company"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(company)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              aria-label="Delete company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body with details */}
      <div className="p-4 space-y-3">
        {/* Status and Priority badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${statusOption?.color}`}>
            {statusOption?.label}
          </span>
          <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${PRIORITY_COLORS[company.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS[3]}`}>
            {PRIORITY_LABELS[company.priority as keyof typeof PRIORITY_LABELS] || 'Medium'} Priority
          </span>
          {company.industry && (
            <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-600">
              {company.industry}
            </span>
          )}
        </div>

        {/* Contact Info */}
        {company.contact_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{company.contact_name}</span>
            {company.contact_title && (
              <span className="text-gray-500">({company.contact_title})</span>
            )}
          </div>
        )}

        {/* Salary Range */}
        {company.salary_range && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{company.salary_range}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {company.application_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Applied: {formatDate(company.application_date)}</span>
            </div>
          )}
          {company.next_followup_date && (
            <div className={`flex items-center gap-1 ${
              isFollowupOverdue()
                ? 'text-red-600 font-medium'
                : isFollowupSoon()
                  ? 'text-yellow-600 font-medium'
                  : ''
            }`}>
              <Calendar className="w-3 h-3" />
              <span>Follow-up: {formatDate(company.next_followup_date)}</span>
              {isFollowupOverdue() && <span className="text-red-500">(Overdue)</span>}
            </div>
          )}
        </div>

        {/* Notes preview */}
        {company.notes && (
          <p className="text-sm text-gray-600 line-clamp-2 border-t border-gray-100 pt-2">
            {company.notes}
          </p>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2 pt-1">
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </a>
          )}
          {company.job_posting_url && (
            <a
              href={company.job_posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Job Posting
            </a>
          )}
          {company.company_linkedin && (
            <a
              href={company.company_linkedin.startsWith('http') ? company.company_linkedin : `https://${company.company_linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
