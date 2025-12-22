// Job Search Bar
// Search and filter controls for job discovery

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Search, MapPin, Filter, ExternalLink } from 'lucide-react';
import Button from '../shared/Button';
import type { JobSearchParams, LocationType } from '../../types/externalJobs.types';

interface JobSearchBarProps {
  onSearch: (params: JobSearchParams) => void;
  isLoading?: boolean;
  initialParams?: Partial<JobSearchParams>;
}

export interface JobSearchBarRef {
  setKeywordsAndSearch: (keywords: string) => void;
}

const LOCATION_TYPE_OPTIONS: Array<{ value: LocationType | ''; label: string }> = [
  { value: '', label: 'All Types' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const GCC_LOCATIONS = [
  'Dubai, UAE',
  'Abu Dhabi, UAE',
  'Riyadh, Saudi Arabia',
  'Jeddah, Saudi Arabia',
  'Doha, Qatar',
  'Kuwait City, Kuwait',
  'Manama, Bahrain',
  'Muscat, Oman',
];

const JobSearchBar = forwardRef<JobSearchBarRef, JobSearchBarProps>(
  function JobSearchBar({ onSearch, isLoading, initialParams }, ref) {
  const [keywords, setKeywords] = useState(initialParams?.keywords || '');
  const [location, setLocation] = useState(initialParams?.location || 'Dubai, UAE');
  const [locationType, setLocationType] = useState<LocationType | ''>(
    initialParams?.location_type || ''
  );
  const [showFilters, setShowFilters] = useState(false);
  const [salary, setSalary] = useState<string>(initialParams?.salary?.toString() || '');

  // Expose method to set keywords and trigger search from parent
  useImperativeHandle(ref, () => ({
    setKeywordsAndSearch: (newKeywords: string) => {
      setKeywords(newKeywords);
      // Auto-search with default location if not set
      const searchLocation = location || 'Dubai, UAE';
      setLocation(searchLocation);
      onSearch({
        keywords: newKeywords,
        location: searchLocation,
        location_type: locationType || undefined,
        salary: salary ? parseInt(salary, 10) : undefined,
      });
    },
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || !location.trim()) return;

    onSearch({
      keywords: keywords.trim(),
      location: location.trim(),
      location_type: locationType || undefined,
      salary: salary ? parseInt(salary, 10) : undefined,
    });
  };

  const openLinkedInSearch = () => {
    const params = new URLSearchParams();
    if (keywords) params.set('keywords', keywords);
    if (location) params.set('location', location);
    // LinkedIn job search URL
    const linkedInUrl = `https://www.linkedin.com/jobs/search/?${params.toString()}`;
    window.open(linkedInUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keywords */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Location */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, country, or region"
              list="gcc-locations"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <datalist id="gcc-locations">
              {GCC_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          {/* Search Button */}
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!keywords.trim() || !location.trim()}
          >
            Search Jobs
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-1">
                Work Type
              </label>
              <select
                id="locationType"
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {LOCATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Min Salary
              </label>
              <input
                id="salary"
                type="number"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                onClick={openLinkedInSearch}
                className="w-full flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Search on LinkedIn
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* LinkedIn Tip */}
      <p className="mt-3 text-xs text-gray-500">
        Tip: Search on LinkedIn, then use "Import Job URL" to track jobs you find.
      </p>
    </div>
  );
});

export default JobSearchBar;
