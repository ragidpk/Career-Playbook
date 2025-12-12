import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import { useJobListings, useJobStats, useCreateJob, useUpdateJob, useDeleteJob, useToggleFavorite } from '../hooks/useJobs';
import Button from '../components/shared/Button';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import JobList from '../components/jobs/JobList';
import JobForm, { type JobFormData } from '../components/jobs/JobForm';
import JobFilters from '../components/jobs/JobFilters';
import { Briefcase, Plus, Search } from 'lucide-react';
import type { JobListing } from '../services/job.service';

export default function Jobs() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<JobListing['application_status'][]>([]);
  const [selectedSources, setSelectedSources] = useState<NonNullable<JobListing['source']>[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: jobs = [], isLoading } = useJobListings(user?.id, {
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    source: selectedSources.length > 0 ? selectedSources : undefined,
    isFavorite: showFavoritesOnly ? true : undefined,
    search: searchQuery || undefined,
  });

  const { data: stats } = useJobStats(user?.id);
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const toggleFavoriteMutation = useToggleFavorite();

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
        await updateJobMutation.mutateAsync({
          jobId: editingJob.id,
          updates: formData,
        });
        showToast('Job updated successfully', 'success');
      } else {
        await createJobMutation.mutateAsync({
          userId: user.id,
          job: formData,
        });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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
            Track job applications and manage your job search pipeline
          </p>
        </div>

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

        {/* Job List */}
        <JobList
          jobs={jobs}
          onEdit={handleEditJob}
          onDelete={handleDeleteJob}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Job Form Modal */}
        <JobForm
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingJob(null);
          }}
          onSubmit={handleSubmitForm}
          job={editingJob}
        />
      </div>
    </div>
  );
}
