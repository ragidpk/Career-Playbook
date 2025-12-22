import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import { useJobListings, useJobStats, useCreateJob, useUpdateJob, useDeleteJob, useToggleFavorite } from '../hooks/useJobs';
import {
  useJobSearch,
  useUserSavedJobs,
  useSaveJob,
  useHideJob,
  useRemoveJobItem,
  useImportAndSaveJob,
  useImportAndTrackJob,
  useTrackInCrm,
} from '../hooks/useExternalJobs';
import Button from '../components/shared/Button';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import JobList from '../components/jobs/JobList';
import JobForm, { type JobFormData } from '../components/jobs/JobForm';
import JobFilters from '../components/jobs/JobFilters';
import JobSearchBar, { type JobSearchBarRef } from '../components/jobs/JobSearchBar';
import ImportJobModal from '../components/jobs/ImportJobModal';
import ExternalJobCard from '../components/jobs/ExternalJobCard';
import JobRecommendations from '../components/jobs/JobRecommendations';
import { Briefcase, Plus, Search, Link2, Bookmark, Globe, List } from 'lucide-react';
import type { JobListing } from '../services/job.service';
import type { JobSearchParams, ExternalJobWithState, ImportJobInput, ExternalJob } from '../types/externalJobs.types';

type TabType = 'discover' | 'saved' | 'my-jobs';

export default function Jobs() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Ref for search bar
  const searchBarRef = useRef<JobSearchBarRef>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('discover');

  // Search state
  const [searchParams, setSearchParams] = useState<JobSearchParams | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);

  // Legacy filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<JobListing['application_status'][]>([]);
  const [selectedSources, setSelectedSources] = useState<NonNullable<JobListing['source']>[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Action tracking
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [hidingJobId, setHidingJobId] = useState<string | null>(null);
  const [unsavingJobId, setUnsavingJobId] = useState<string | null>(null);
  const [trackingJobId, setTrackingJobId] = useState<string | null>(null);

  // Legacy queries
  const { data: jobs = [], isLoading: isLoadingLegacy } = useJobListings(user?.id, {
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    source: selectedSources.length > 0 ? selectedSources : undefined,
    isFavorite: showFavoritesOnly ? true : undefined,
    search: searchQuery || undefined,
  });
  const { data: stats } = useJobStats(user?.id);

  // External jobs queries
  const { data: searchResults, isLoading: isSearching } = useJobSearch(searchParams);
  const { data: savedJobs = [], isLoading: isLoadingSaved } = useUserSavedJobs(user?.id);

  // Mutations
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const toggleFavoriteMutation = useToggleFavorite();
  const saveJobMutation = useSaveJob();
  const hideJobMutation = useHideJob();
  const removeJobMutation = useRemoveJobItem();
  const importAndSaveMutation = useImportAndSaveJob();
  const importAndTrackMutation = useImportAndTrackJob();
  const trackInCrmMutation = useTrackInCrm();

  // Handlers
  const handleSearch = (params: JobSearchParams) => {
    setSearchParams(params);
  };

  // Handler for clicking keywords from AI recommendations
  const handleSearchKeyword = (keyword: string) => {
    if (searchBarRef.current) {
      searchBarRef.current.setKeywordsAndSearch(keyword);
    }
  };

  const handleSaveJob = async (job: ExternalJob | ExternalJobWithState) => {
    if (!user) return;
    setSavingJobId(job.id);
    try {
      await saveJobMutation.mutateAsync({
        userId: user.id,
        externalJobId: job.id,
        // Pass job data so it can be saved to external_jobs table first
        jobData: {
          provider: job.provider,
          provider_job_id: job.provider_job_id,
          canonical_url: job.canonical_url,
          title: job.title,
          company_name: job.company_name,
          location: job.location,
          location_type: job.location_type,
          description_snippet: job.description_snippet,
          posted_at: job.posted_at,
          apply_url: job.apply_url,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency,
        },
      });
      showToast('Job saved', 'success');
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('Failed to save job', 'error');
    } finally {
      setSavingJobId(null);
    }
  };

  const handleHideJob = async (job: ExternalJob | ExternalJobWithState) => {
    if (!user) return;
    setHidingJobId(job.id);
    try {
      await hideJobMutation.mutateAsync({
        userId: user.id,
        externalJobId: job.id,
        // Pass job data so it can be saved to external_jobs table first
        jobData: {
          provider: job.provider,
          provider_job_id: job.provider_job_id,
          canonical_url: job.canonical_url,
          title: job.title,
          company_name: job.company_name,
          location: job.location,
          location_type: job.location_type,
          description_snippet: job.description_snippet,
          posted_at: job.posted_at,
          apply_url: job.apply_url,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency,
        },
      });
      showToast('Job hidden', 'success');
    } catch (error) {
      console.error('Error hiding job:', error);
      showToast('Failed to hide job', 'error');
    } finally {
      setHidingJobId(null);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    if (!user) return;
    setUnsavingJobId(jobId);
    try {
      await removeJobMutation.mutateAsync({ userId: user.id, externalJobId: jobId });
      showToast('Job removed from saved', 'success');
    } catch (error) {
      console.error('Error removing job:', error);
      showToast('Failed to remove job', 'error');
    } finally {
      setUnsavingJobId(null);
    }
  };

  const handleTrackInCrm = async (job: ExternalJob | ExternalJobWithState) => {
    if (!user) return;
    setTrackingJobId(job.id);
    try {
      const result = await trackInCrmMutation.mutateAsync({
        userId: user.id,
        input: {
          externalJobId: job.id,
          // Pass job data directly for jobs not yet in the database
          jobData: {
            title: job.title,
            company_name: job.company_name,
            location: job.location,
            location_type: job.location_type,
            description_snippet: job.description_snippet,
            canonical_url: job.canonical_url,
            apply_url: job.apply_url,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: job.salary_currency,
            provider: job.provider,
          },
        },
      });
      showToast(
        result.isNewCompany
          ? 'Job added to CRM with new company'
          : 'Job added to CRM',
        'success'
      );
    } catch (error) {
      console.error('Error tracking job:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to track job',
        'error'
      );
    } finally {
      setTrackingJobId(null);
    }
  };

  const handleViewInCrm = () => {
    navigate('/crm');
  };

  const handleImportJob = async (input: ImportJobInput) => {
    if (!user) return;
    try {
      await importAndSaveMutation.mutateAsync({ userId: user.id, input });
      showToast('Job imported and saved', 'success');
      setActiveTab('saved');
    } catch (error) {
      console.error('Error importing job:', error);
      throw error;
    }
  };

  const handleImportAndTrack = async (input: ImportJobInput) => {
    if (!user) return;
    try {
      await importAndTrackMutation.mutateAsync({ userId: user.id, importInput: input });
      showToast('Job imported and added to CRM', 'success');
    } catch (error) {
      console.error('Error importing job:', error);
      throw error;
    }
  };

  // Legacy handlers
  const handleAddJob = () => {
    setEditingJob(null);
    setIsFormOpen(true);
  };

  const handleEditJob = (job: JobListing) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleDeleteJob = async (job: JobListing) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the ${job.title} job at ${job.company_name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteJobMutation.mutateAsync(job.id);
      showToast('Job deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Failed to delete job', 'error');
    }
  };

  const handleToggleFavorite = async (job: JobListing) => {
    try {
      await toggleFavoriteMutation.mutateAsync({
        jobId: job.id,
        isFavorite: !job.is_favorite,
      });
      showToast(
        job.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleSubmitForm = async (formData: JobFormData) => {
    if (!user) return;

    try {
      if (editingJob) {
        await updateJobMutation.mutateAsync({ jobId: editingJob.id, updates: formData });
        showToast('Job updated successfully', 'success');
      } else {
        await createJobMutation.mutateAsync({ userId: user.id, job: formData });
        showToast('Job added successfully', 'success');
      }
      setIsFormOpen(false);
      setEditingJob(null);
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('Failed to save job', 'error');
      throw error;
    }
  };

  // Get jobs for discover tab (filter out hidden)
  const discoverJobs = searchResults?.jobs.filter((job) => {
    const savedJob = savedJobs.find((s) => s.id === job.id);
    return !savedJob || savedJob.user_state !== 'hidden';
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-primary-500" />
            <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
          </div>
          <p className="text-gray-600">
            Discover jobs, save opportunities, and track your applications
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'discover'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              Discover Jobs
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'saved'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved Jobs
              {savedJobs.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                  {savedJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-jobs'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              My Jobs
              {stats && stats.total > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                  {stats.total}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* AI Job Recommendations */}
            <JobRecommendations onSearchKeyword={handleSearchKeyword} />

            {/* Search Bar */}
            <JobSearchBar ref={searchBarRef} onSearch={handleSearch} isLoading={isSearching} />

            {/* Import Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setIsImportOpen(true)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Import Job URL
              </Button>
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {!isSearching && searchResults && (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  Found {searchResults.totalCount} jobs
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoverJobs.map((job) => {
                    const savedJob = savedJobs.find((s) => s.id === job.id) as ExternalJobWithState | undefined;
                    return (
                      <ExternalJobCard
                        key={job.id}
                        job={job}
                        userState={savedJob?.user_state}
                        crmApplicationId={savedJob?.crm_application_id}
                        onSave={() => handleSaveJob(job)}
                        onHide={() => handleHideJob(job)}
                        onTrackInCrm={() => handleTrackInCrm(job)}
                        onViewInCrm={savedJob?.crm_application_id ? handleViewInCrm : undefined}
                        isSaving={savingJobId === job.id}
                        isHiding={hidingJobId === job.id}
                        isTracking={trackingJobId === job.id}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Empty State */}
            {!isSearching && !searchParams && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Discover Your Next Opportunity
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Search for jobs in the GCC region using our job search, or import jobs from
                  LinkedIn and other job boards using the "Import Job URL" button.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setIsImportOpen(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Import from LinkedIn
                  </Button>
                </div>
              </div>
            )}

            {!isSearching && searchParams && discoverJobs.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Jobs Found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or import a job manually.
                </p>
                <Button
                  onClick={() => setIsImportOpen(true)}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Import Job URL
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Saved Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {isLoadingSaved && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {!isLoadingSaved && savedJobs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedJobs.map((job) => (
                  <ExternalJobCard
                    key={job.id}
                    job={job}
                    userState={job.user_state}
                    crmApplicationId={job.crm_application_id}
                    onUnsave={() => handleUnsaveJob(job.id)}
                    onTrackInCrm={() => handleTrackInCrm(job)}
                    onViewInCrm={job.crm_application_id ? handleViewInCrm : undefined}
                    isUnsaving={unsavingJobId === job.id}
                    isTracking={trackingJobId === job.id}
                  />
                ))}
              </div>
            )}

            {!isLoadingSaved && savedJobs.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Saved Jobs Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Save jobs you're interested in from the Discover tab, or import jobs from
                  LinkedIn to start building your collection.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => setActiveTab('discover')}
                    variant="secondary"
                  >
                    Discover Jobs
                  </Button>
                  <Button
                    onClick={() => setIsImportOpen(true)}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    Import Job URL
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Jobs Tab (Legacy) */}
        {activeTab === 'my-jobs' && (
          <>
            {/* Stats Bar */}
            {stats && stats.total > 0 && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.saved}</div>
                  <div className="text-sm text-gray-600">Saved</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
                  <div className="text-sm text-gray-600">Applied</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.interviewing}</div>
                  <div className="text-sm text-gray-600">Interviewing</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.offer}</div>
                  <div className="text-sm text-gray-600">Offers</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <div className="text-2xl font-bold text-gray-500">{stats.withdrawn}</div>
                  <div className="text-sm text-gray-600">Withdrawn</div>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs by title, company, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Filter and Add Button */}
              <div className="flex gap-3">
                <JobFilters
                  selectedStatuses={selectedStatuses}
                  selectedSources={selectedSources}
                  showFavoritesOnly={showFavoritesOnly}
                  onStatusChange={setSelectedStatuses}
                  onSourceChange={setSelectedSources}
                  onFavoritesChange={setShowFavoritesOnly}
                />
                <Button
                  onClick={handleAddJob}
                  variant="primary"
                  className="whitespace-nowrap"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Job
                  </span>
                </Button>
              </div>
            </div>

            {/* Results Count */}
            {(searchQuery || selectedStatuses.length > 0 || selectedSources.length > 0 || showFavoritesOnly) && (
              <div className="mb-4 text-sm text-gray-600">
                Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                {(selectedStatuses.length > 0 || selectedSources.length > 0 || showFavoritesOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStatuses([]);
                      setSelectedSources([]);
                      setShowFavoritesOnly(false);
                    }}
                    className="ml-2 text-primary-500 hover:text-primary-600 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {isLoadingLegacy && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}

            {/* Job List */}
            {!isLoadingLegacy && (
              <JobList
                jobs={jobs}
                onEdit={handleEditJob}
                onDelete={handleDeleteJob}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </>
        )}

        {/* Modals */}
        <JobForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingJob(null);
          }}
          onSubmit={handleSubmitForm}
          job={editingJob}
        />

        <ImportJobModal
          open={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={handleImportJob}
          onImportAndTrack={handleImportAndTrack}
        />
      </div>
    </div>
  );
}
