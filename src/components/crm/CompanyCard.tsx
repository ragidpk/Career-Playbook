import { STATUS_OPTIONS } from './StatusFilter';
import type { Company } from '../../services/company.service';

interface CompanyCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export default function CompanyCard({ company, onEdit, onDelete }: CompanyCardProps) {
  const statusOption = STATUS_OPTIONS.find((opt) => opt.value === company.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {company.name}
          </h3>
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-500 hover:text-primary-600 hover:underline truncate block"
            >
              {company.website_url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
        <div className="flex gap-2 ml-2">
          <button
            type="button"
            onClick={() => onEdit(company)}
            className="p-1 text-gray-500 hover:text-primary-500 transition-colors"
            aria-label="Edit company"
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
            onClick={() => onDelete(company)}
            className="p-1 text-gray-500 hover:text-red-500 transition-colors"
            aria-label="Delete company"
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
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusOption?.color}`}>
          {statusOption?.label}
        </span>
        <span className="inline-flex items-center px-3 py-1 text-xs text-gray-600 bg-gray-50 rounded-full">
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formatDate(company.date_added)}
        </span>
      </div>

      {company.notes && (
        <p className="text-sm text-gray-600 line-clamp-2">
          {company.notes}
        </p>
      )}
    </div>
  );
}
