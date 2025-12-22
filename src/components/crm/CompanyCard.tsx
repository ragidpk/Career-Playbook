import { useState } from 'react';
import {
  Star,
  MapPin,
  DollarSign,
  User,
  Calendar,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Tag,
} from 'lucide-react';
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
  2: 'bg-primary-50 text-primary-600',
  3: 'bg-warning-50 text-warning-600',
  4: 'bg-orange-100 text-orange-600',
  5: 'bg-error-50 text-error-600',
};

const PRIORITY_LABELS = {
  1: 'Low',
  2: 'Med-Low',
  3: 'Medium',
  4: 'Med-High',
  5: 'High',
};

// Extract skills from job description/notes using common patterns
function extractSkills(text: string | null): string[] {
  if (!text) return [];

  // Common skill keywords to look for
  const skillPatterns = [
    // Technical
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|React|Angular|Vue|Node\.js|AWS|Azure|GCP|Docker|Kubernetes|SQL|MongoDB|PostgreSQL|Redis|GraphQL|REST|API|Git|CI\/CD|Agile|Scrum)\b/gi,
    // Soft skills
    /\b(Leadership|Communication|Problem.?solving|Team.?work|Analytical|Strategic|Management)\b/gi,
    // AI/ML
    /\b(Machine Learning|ML|AI|Artificial Intelligence|Deep Learning|NLP|Computer Vision|Data Science|TensorFlow|PyTorch)\b/gi,
    // Cloud/DevOps
    /\b(Cloud|DevOps|Infrastructure|Terraform|Ansible|Jenkins|Linux|Unix)\b/gi,
  ];

  const skills = new Set<string>();
  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(skill => skills.add(skill));
    }
  }

  return Array.from(skills).slice(0, 8); // Limit to 8 skills
}

export default function CompanyCard({
  company,
  onEdit,
  onDelete,
  onToggleFavorite,
}: CompanyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusOption = STATUS_OPTIONS.find(
    (opt) => opt.value === company.status
  );

  // Extract skills from notes/description
  const skills = extractSkills(company.notes);

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
    const diffDays = Math.ceil(
      (followup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 3;
  };

  return (
    <div className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-smooth">
      {/* Header with company name and actions */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-gray-900 truncate">
                {company.name}
              </h3>
              {company.is_favorite && (
                <Star className="w-4 h-4 text-warning-500 fill-current flex-shrink-0" />
              )}
            </div>
            {company.job_title && (
              <p className="text-sm text-primary-600 font-medium truncate mt-1">
                {company.job_title}
              </p>
            )}
            {company.location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{company.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(company)}
                className={`p-2 rounded-xl transition-smooth ${
                  company.is_favorite
                    ? 'text-warning-500 bg-warning-50'
                    : 'text-gray-300 hover:text-warning-500 hover:bg-warning-50'
                }`}
                title={
                  company.is_favorite
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                <Star
                  className={`w-4 h-4 ${company.is_favorite ? 'fill-current' : ''}`}
                />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(company)}
              className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-smooth"
              aria-label="Edit company"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(company)}
              className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-smooth"
              aria-label="Delete company"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body with details */}
      <div className="p-5 space-y-4">
        {/* Status and Priority badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-pill ${statusOption?.color}`}
          >
            {statusOption?.label}
          </span>
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-pill ${PRIORITY_COLORS[company.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS[3]}`}
          >
            {PRIORITY_LABELS[company.priority as keyof typeof PRIORITY_LABELS] ||
              'Medium'}{' '}
            Priority
          </span>
          {company.industry && (
            <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-pill bg-purple-50 text-purple-600">
              {company.industry}
            </span>
          )}
        </div>

        {/* Contact Info */}
        {company.contact_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 font-medium">
              {company.contact_name}
            </span>
            {company.contact_title && (
              <span className="text-gray-500">({company.contact_title})</span>
            )}
          </div>
        )}

        {/* Salary Range */}
        {company.salary_range && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{company.salary_range}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {company.application_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Applied: {formatDate(company.application_date)}</span>
            </div>
          )}
          {company.next_followup_date && (
            <div
              className={`flex items-center gap-1.5 ${
                isFollowupOverdue()
                  ? 'text-error-600 font-medium'
                  : isFollowupSoon()
                    ? 'text-warning-600 font-medium'
                    : ''
              }`}
            >
              <Calendar
                className={`w-3.5 h-3.5 ${isFollowupOverdue() ? 'text-error-500' : isFollowupSoon() ? 'text-warning-500' : 'text-gray-400'}`}
              />
              <span>Follow-up: {formatDate(company.next_followup_date)}</span>
              {isFollowupOverdue() && (
                <span className="bg-error-50 text-error-600 px-2 py-0.5 rounded-pill font-semibold">
                  Overdue
                </span>
              )}
            </div>
          )}
        </div>

        {/* Skills Tags */}
        {skills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Tag className="w-3.5 h-3.5" />
              <span>Skills Required</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-primary-50 text-primary-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job Description - Expandable */}
        {company.notes && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary-600 transition-smooth"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Job Description</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <div
              className={`bg-gray-50 rounded-xl p-3 overflow-hidden transition-all duration-300 ${
                isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-16'
              }`}
            >
              <p className={`text-sm text-gray-600 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                {company.notes}
              </p>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2 pt-1">
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-pill transition-smooth"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-pill transition-smooth"
            >
              <ExternalLink className="w-3 h-3" />
              Job Posting
            </a>
          )}
          {company.company_linkedin && (
            <a
              href={
                company.company_linkedin.startsWith('http')
                  ? company.company_linkedin
                  : `https://${company.company_linkedin}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-pill transition-smooth"
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
