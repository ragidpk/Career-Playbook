import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { STATUS_CONFIG } from './StatusBadge';
import type { JobListing } from '../../services/job.service';

interface JobFiltersProps {
  selectedStatuses: JobListing['application_status'][];
  selectedSources: NonNullable<JobListing['source']>[];
  showFavoritesOnly: boolean;
  onStatusChange: (statuses: JobListing['application_status'][]) => void;
  onSourceChange: (sources: NonNullable<JobListing['source']>[]) => void;
  onFavoritesChange: (showFavorites: boolean) => void;
}

const SOURCE_OPTIONS: Array<{ value: NonNullable<JobListing['source']>; label: string }> = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'company_site', label: 'Company Site' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

export default function JobFilters({
  selectedStatuses,
  selectedSources,
  showFavoritesOnly,
  onStatusChange,
  onSourceChange,
  onFavoritesChange,
}: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusToggle = (status: JobListing['application_status']) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleSourceToggle = (source: NonNullable<JobListing['source']>) => {
    if (selectedSources.includes(source)) {
      onSourceChange(selectedSources.filter((s) => s !== source));
    } else {
      onSourceChange([...selectedSources, source]);
    }
  };

  const clearAllFilters = () => {
    onStatusChange([]);
    onSourceChange([]);
    onFavoritesChange(false);
  };

  const activeFilterCount =
    selectedStatuses.length + selectedSources.length + (showFavoritesOnly ? 1 : 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-5 h-5" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-primary-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
              <div className="space-y-2">
                {(Object.keys(STATUS_CONFIG) as JobListing['application_status'][]).map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {STATUS_CONFIG[status].label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Source</h4>
              <div className="space-y-2">
                {SOURCE_OPTIONS.map((source) => (
                  <label key={source.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.value)}
                      onChange={() => handleSourceToggle(source.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {source.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Favorites Filter */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => onFavoritesChange(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Favorites only
                </span>
              </label>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
